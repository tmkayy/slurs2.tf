using Microsoft.EntityFrameworkCore;
using slurs2.backend.Data;
using slurs2.backend.Models;

namespace slurs2.backend.Services;

public class PlayerScannerService (LogsFetcherService logsFetcherService,
    SlurDetectorService slurDetectorService, PlayerService playerService, AppDbContext db,
    ScanProgressTracker progress)
{
    private static string ToSteamId64(string steamId3)
    {
        var inner = steamId3.TrimStart('[').TrimEnd(']');
        var parts = inner.Split(':');
        var w = long.Parse(parts[2]);
        return (76561197960265728L + w).ToString();
    }
    
    public async Task ScanPlayer(string steamId, CancellationToken cancellationToken = default)
    {
        var player = await playerService.GetOrCreatePlayerAsync(steamId);
        var logs = await logsFetcherService.GetLogIdsForPlayer(steamId);

        var newLogs = player.LastScannedLogId.HasValue?
            logs.Where(l => l.Id > player.LastScannedLogId.Value).ToList() : logs;

        progress.SetTotal(steamId, newLogs.Count);

        if (!newLogs.Any())
        {
            await playerService.UpdateScanMetadata(steamId, player.LastScannedLogId);
            return;
        }
        
        var processedSteamIds = new HashSet<string>() {steamId};
        int batchSize = 0;
        var semaphore = new SemaphoreSlim(5);
    
        foreach (var (logId, logDate) in newLogs)
        {
            if (cancellationToken.IsCancellationRequested)
            {
                //keep the logs processed so far; the next scan skips them.
                await db.SaveChangesAsync();
                cancellationToken.ThrowIfCancellationRequested();
            }

            var alreadyProcessed = await db.ProcessedLogs.AnyAsync(l => l.LogId == logId);
            if (alreadyProcessed)
            {
                progress.LogScanned(steamId);
                continue;
            }
            
            await semaphore.WaitAsync();
            List<ApiResponses.ChatMessage> messages;
            try
            {
                messages = await logsFetcherService.GetChatMessages(logId);
            }
            finally
            {
                semaphore.Release();
            }

            var validMessages = messages
                .Where(m => m.Steamid != "Console" && m.Msg.Length >= 3).ToList();

            if (!validMessages.Any())
            {
                db.ProcessedLogs.Add(new ProcessedLog { LogId = logId, });
                batchSize++;
                progress.LogScanned(steamId);
                continue;
            }

            var texts = validMessages.Select(m => m.Msg).ToList();
            var classifications = await slurDetectorService.AnalyzeBatchAsync(texts);
            db.ProcessedLogs.Add(new ProcessedLog { LogId = logId });
            
            for (int i = 0; i < validMessages.Count; i++)
            {
                var message = validMessages[i];
                var result = classifications[i];
                if (!result.Found) continue;

                var msgSteamId64 = ToSteamId64(message.Steamid);
                if (!processedSteamIds.Contains(msgSteamId64))
                {
                    await playerService.GetOrCreatePlayerAsync(msgSteamId64);
                    processedSteamIds.Add(msgSteamId64);
                }

                db.SlurInstances.Add(new SlurInstance(
                    message.Msg,
                    logId,
                    msgSteamId64,
                    result.Count,
                    DateTimeOffset.FromUnixTimeSeconds(logDate).UtcDateTime,
                    result.Type!.Value
                ));
            }
            
            batchSize++;
            if (batchSize >= 50)
            {
                await db.SaveChangesAsync();
                batchSize = 0;
            }

            progress.LogScanned(steamId);
        }
        
        var maxLog = newLogs.MaxBy(l => l.Id);
        await playerService.UpdateScanMetadata(steamId, maxLog.Id);
        await db.SaveChangesAsync();
    }
}