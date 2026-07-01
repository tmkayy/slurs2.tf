using slurs2.backend.Models;

namespace slurs2.backend.DTOs;

public class SlurInstanceDto
{
    public string Message { get; init; } = null!;
    public int LogId { get; init; }
    public string LogUrl => $"https://logs.tf/{LogId}";
    public int SlurCount { get; init; }
    public DateTime MessageDate { get; init; }
    public SlurType SlurType { get; init; }
}