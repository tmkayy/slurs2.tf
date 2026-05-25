namespace slurs2.backend.ApiResponses;

public class SteamPlayerSummaryResponse
{
    public SteamResponse Response { get; set; } = null!;
}

public class SteamResponse
{
    public List<SteamPlayer> Players { get; set; } = [];
}

public class SteamPlayer
{
    public string Steamid { get; set; } = null!;
    public string Personaname { get; set; } = null!;
    public string? Loccountrycode { get; set; }
}