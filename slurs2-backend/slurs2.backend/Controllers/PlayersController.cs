using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using slurs2.backend.Data;
using slurs2.backend.DTOs;
using slurs2.backend.Models;
using slurs2.backend.Services;

namespace slurs2.backend.Controllers;


[ApiController]
[Route("api/players")]
public class PlayersController(AppDbContext db, PlayerScannerService playerScannerService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetLeaderBoard()
    {
        var players = await db.Players
            .Include(p => p.SlurInstances)
            .OrderByDescending(p => p.SlurInstances.Count(s=> s.SlurType == SlurType.Slur))
            .ToListAsync();

        var result = players.Select((p, i) => new PlayerSummaryDto
        {
            Rank = i + 1,
            SteamId = p.SteamId,
            SteamName = p.SteamName,
            Country = p.Country,
            SlurCount = p.SlurInstances.Count(s=> s.SlurType == SlurType.Slur)
        }).ToList();

        return Ok(result);
    }

    [HttpGet("country/{country}")]
    public async Task<IActionResult> GetLeaderboardByCountry(string country)
    {
        var players = await db.Players
            .Where(p=>p.Country == country)
            .Include(p=>p.SlurInstances)
            .OrderByDescending(p => p.SlurInstances.Count(s=> s.SlurType == SlurType.Slur))
            .ToListAsync();
        
        var result = players.Select((p, i) => new PlayerSummaryDto
        {
            Rank = i + 1,
            SteamId = p.SteamId,
            SteamName = p.SteamName,
            Country = p.Country,
            SlurCount = p.SlurInstances.Count(s=> s.SlurType == SlurType.Slur)
        }).ToList();
        
        return Ok(result);
    }

    [HttpGet("{steamId}")]
    public async Task<IActionResult> GetPlayer(string steamId)
    {
        var player = await db.Players.Include(p=>p.SlurInstances)
            .FirstOrDefaultAsync(p=>p.SteamId==steamId);

        if (player == null)
            return NotFound();

        var dto = new PlayerDetailDto
        {
            SteamId = player.SteamId,
            SteamName = player.SteamName,
            Country = player.Country,
            SlurInstances = player.SlurInstances.Select(s => new SlurInstanceDto
            {
                Message = s.Message,
                LogId = s.LogId,
                SlurCount = s.SlurCount,
                MessageDate = s.MessageDate,
                SlurType = s.SlurType
            }).ToList()
        };
        return Ok(dto);
    }

    [HttpPost("{steamId}/scan")]
    public IActionResult ScanPlayer(string steamId, [FromServices] IServiceScopeFactory scopeFactory)
    {
        _ = Task.Run(async () =>
        {
            try
            {
                using var scope = scopeFactory.CreateScope();
                var scanner = scope.ServiceProvider.GetRequiredService<PlayerScannerService>();
                await scanner.ScanPlayer(steamId);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Scan failed: {ex}");
            }
        });
        return Accepted();
    }
}