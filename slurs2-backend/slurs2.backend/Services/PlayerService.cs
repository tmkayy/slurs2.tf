using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using slurs2.backend.ApiClients;
using slurs2.backend.Data;
using slurs2.backend.Models;

namespace slurs2.backend.Services;

public class PlayerService
    (ISteamApi steamApi, AppDbContext db, IConfiguration configuration)
{
    //lmaaoooooo
    private static readonly Dictionary<string, string> CountryCodes = new(StringComparer.OrdinalIgnoreCase)
    {
        { "Afghanistan", "AF" }, { "Albania", "AL" }, { "Algeria", "DZ" }, { "Andorra", "AD" },
        { "Angola", "AO" }, { "Argentina", "AR" }, { "Armenia", "AM" }, { "Australia", "AU" },
        { "Austria", "AT" }, { "Azerbaijan", "AZ" }, { "Bahrain", "BH" }, { "Bangladesh", "BD" },
        { "Belarus", "BY" }, { "Belgium", "BE" }, { "Bolivia", "BO" }, { "Bosnia and Herzegovina", "BA" },
        { "Brazil", "BR" }, { "Bulgaria", "BG" }, { "Canada", "CA" }, { "Chile", "CL" },
        { "China", "CN" }, { "Colombia", "CO" }, { "Croatia", "HR" }, { "Cyprus", "CY" },
        { "Czech Republic", "CZ" }, { "Denmark", "DK" }, { "Ecuador", "EC" }, { "Egypt", "EG" },
        { "Estonia", "EE" }, { "Finland", "FI" }, { "France", "FR" }, { "Georgia", "GE" },
        { "Germany", "DE" }, { "Greece", "GR" }, { "Hungary", "HU" }, { "Iceland", "IS" },
        { "India", "IN" }, { "Indonesia", "ID" }, { "Iran", "IR" }, { "Iraq", "IQ" },
        { "Ireland", "IE" }, { "Israel", "IL" }, { "Italy", "IT" }, { "Japan", "JP" },
        { "Jordan", "JO" }, { "Kazakhstan", "KZ" }, { "Kosovo", "XK" }, { "Kuwait", "KW" },
        { "Latvia", "LV" }, { "Lebanon", "LB" }, { "Lithuania", "LT" }, { "Luxembourg", "LU" },
        { "Macedonia", "MK" }, { "Malaysia", "MY" }, { "Malta", "MT" }, { "Mexico", "MX" },
        { "Moldova", "MD" }, { "Montenegro", "ME" }, { "Morocco", "MA" }, { "Netherlands", "NL" },
        { "New Zealand", "NZ" }, { "Nigeria", "NG" }, { "Norway", "NO" }, { "Pakistan", "PK" },
        { "Paraguay", "PY" }, { "Peru", "PE" }, { "Philippines", "PH" }, { "Poland", "PL" },
        { "Portugal", "PT" }, { "Romania", "RO" }, { "Russia", "RU" }, { "Saudi Arabia", "SA" },
        { "Serbia", "RS" }, { "Singapore", "SG" }, { "Slovakia", "SK" }, { "Slovenia", "SI" },
        { "South Africa", "ZA" }, { "South Korea", "KR" }, { "Spain", "ES" }, { "Sweden", "SE" },
        { "Switzerland", "CH" }, { "Taiwan", "TW" }, { "Thailand", "TH" }, { "Tunisia", "TN" },
        { "Turkey", "TR" }, { "Ukraine", "UA" }, { "United Arab Emirates", "AE" },
        { "United Kingdom", "GB" }, { "United States", "US" }, { "Uruguay", "UY" },
        { "Venezuela", "VE" }, { "Vietnam", "VN" }
    };
    
    private static string? ToCountryCode(string? countryName)
    {
        if (string.IsNullOrEmpty(countryName))
            return null;
        return CountryCodes.GetValueOrDefault(countryName);
    }
    
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
            return ToCountryCode(doc.RootElement.GetProperty("player").GetProperty("country").GetString());
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