namespace slurs2.backend.DTOs;

public class PlayerSummaryDto
{
    public int Rank { get; init; }
    public string SteamId { get; init; } = null!;
    public string SteamName { get; init; } = null!;
    public string? Country { get; init; }
    public int SlurCount { get; init; }
}