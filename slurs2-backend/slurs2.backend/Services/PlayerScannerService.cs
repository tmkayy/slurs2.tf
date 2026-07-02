using Microsoft.EntityFrameworkCore;
using slurs2.backend.Data;
using slurs2.backend.Models;

namespace slurs2.backend.Services;

public class PlayerScannerService (LogsFetcherService logsFetcherService,
    SlurDetectorService slurDetectorService, PlayerService playerService, AppDbContext db)
{
    public async Task ScanPlayer(string steamId)
    {
        await playerService.GetOrCreatePlayerAsync(steamId);
        var logs = await logsFetcherService.GetLogIdsForPlayer(steamId);

        foreach (var (logId, logDate) in logs)
        {
            var alreadyProcessed = await db.ProcessedLogs.AnyAsync(l => l.LogId == logId);
    
            if (alreadyProcessed)
                continue;
    
            var messages = await logsFetcherService.GetChatMessages(logId);
            await Task.Delay(500);
            
            foreach (var message in messages.Where(m => m.Steamid == steamId))
            {
                var result = slurDetectorService.Analyze(message.Msg);
                if (!result.Found)
                    continue;

                db.SlurInstances.Add(new SlurInstance(
                    message.Msg,
                    logId,
                    steamId,
                    result.Count,
                    DateTimeOffset.FromUnixTimeSeconds(logDate).UtcDateTime,
                    result.Type!.Value
                ));
            }

            db.ProcessedLogs.Add(new ProcessedLog { LogId = logId });
        }
        
        await db.SaveChangesAsync();
    }
}