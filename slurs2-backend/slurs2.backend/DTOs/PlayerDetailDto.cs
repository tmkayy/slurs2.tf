namespace slurs2.backend.DTOs;

public class PlayerDetailDto
{
    public string SteamId { get; init; } = null!;
    public string SteamName { get; init; } = null!;
    public string? Country { get; init; }
    public List<SlurInstanceDto> SlurInstances { get; init; } = [];
    
    public DateTime? LastScannedLogDate { get; init; }
}