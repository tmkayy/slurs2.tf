using Microsoft.EntityFrameworkCore;
using slurs2.backend.ApiClients;
using slurs2.backend.Data;
using slurs2.backend.Models;

namespace slurs2.backend.Services;

public class PlayerService
    (ISteamApi steamApi, IEtf2lApi etf2lApi, AppDbContext db, IConfiguration configuration)
{
    private async Task<Player> FetchPlayerInfo(string steamId)
    {
        var apiKey = configuration["SteamApiKey"];
        var steamResponse = await steamApi.GetPlayerSummaries(apiKey!, steamId);
        var steamPlayer = steamResponse.Response.Players.FirstOrDefault();

        string? country = null;

        try
        {
            var etf2lResponse = await etf2lApi.GetPlayer(steamId);
            country = etf2lResponse.Player.Country;
        }
        catch
        {
            // doesn't matter if he doesn't have etf2l profile
        }

        return new Player
        {
            SteamId = steamId,
            SteamName = (steamPlayer != null) ? steamPlayer.Personaname : "Unknown",
            Country = string.IsNullOrEmpty(country) ? steamPlayer?.Loccountrycode : country,
        };
    }
    
    public async Task<Player> GetOrCreatePlayerAsync(string steamId)
    {
        var existing =  await db.Players.FirstOrDefaultAsync(p=>p.SteamId == steamId);
        if (existing != null)
            return existing;
        
        var player =  await FetchPlayerInfo(steamId);
        db.Players.Add(player);
        await db.SaveChangesAsync();
        return player;
    }
}