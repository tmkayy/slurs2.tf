using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using slurs2.backend.ApiClients;
using slurs2.backend.Data;
using slurs2.backend.Models;

namespace slurs2.backend.Services;

public class PlayerService
    (ISteamApi steamApi, AppDbContext db, IConfiguration configuration)
{
    //bruh
    private readonly HttpClient _httpClient = new();

    private async Task<string?> GetEtf2lCountry(string steamId)
    {
        try
        {
            //BRUH
            var html = await _httpClient.GetStringAsync($"https://api.etf2l.org/player/{steamId}");
            var start = html.IndexOf("<div id=\"source\" style=\"display:none;\">");
            if (start == -1) return null;
            start += "<div id=\"source\" style=\"display:none;\">".Length;
            var end = html.IndexOf("</div>", start);
            if (end == -1) return null;
            var json = html[start..end];
            var doc = JsonDocument.Parse(json);
            return doc.RootElement.GetProperty("player").GetProperty("country").GetString();
        }
        catch
        {
            return null;
        }
    }
    
    private async Task<Player> FetchPlayerInfo(string steamId)
    {
        var apiKey = configuration["SteamApiKey"];
        var steamResponse = await steamApi.GetPlayerSummaries(apiKey!, steamId);
        var steamPlayer = steamResponse.Response.Players.FirstOrDefault();

        string? country = null;

        country = await GetEtf2lCountry(steamId);

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
        {
            var updated = await FetchPlayerInfo(steamId);
            existing.SteamName = updated.SteamName;
            existing.Country = updated.Country;
            await db.SaveChangesAsync();
            return existing;
        }
        
        var player =  await FetchPlayerInfo(steamId);
        db.Players.Add(player);
        await db.SaveChangesAsync();
        return player;
    }
}