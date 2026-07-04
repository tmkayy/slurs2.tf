using Microsoft.EntityFrameworkCore;
using slurs2.backend.Data;
using slurs2.backend.Models;

namespace slurs2.backend.Services;

public class PlayerScannerService (LogsFetcherService logsFetcherService,
    SlurDetectorService slurDetectorService, PlayerService playerService, AppDbContext db)
{
    private static string ToSteamId64(string steamId3)
    {
        var inner = steamId3.TrimStart('[').TrimEnd(']');
        var parts = inner.Split(':');
        var w = long.Parse(parts[2]);
        return (76561197960265728L + w).ToString();
    }
    
    public async Task ScanPlayer(string steamId)
    {
        await playerService.GetOrCreatePlayerAsync(steamId);
        var logs = await logsFetcherService.GetLogIdsForPlayer(steamId);
        int batchSize = 0;
    
        foreach (var (logId, logDate) in logs)
        {
            var alreadyProcessed = await db.ProcessedLogs.AnyAsync(l => l.LogId == logId);
            if (alreadyProcessed) continue;
    
            var messages = await logsFetcherService.GetChatMessages(logId);
            await Task.Delay(100);
    
            db.ProcessedLogs.Add(new ProcessedLog { LogId = logId });
            
            foreach (var message in messages)
            {
                if (message.Steamid == "Console") continue;
    
                var result = await slurDetectorService.AnalyzeAsync(message.Msg);
                if (!result.Found) continue;
    
                var msgSteamId64 = ToSteamId64(message.Steamid);
                await playerService.GetOrCreatePlayerAsync(msgSteamId64);
    
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
        }
    
        await db.SaveChangesAsync();
    }
}