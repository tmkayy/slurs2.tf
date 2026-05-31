using slurs2.backend.Models;

namespace slurs2.backend.Services;

public class SlurDetectionResult
{
    public bool Found { get; init; }
    public SlurType? Type { get; init; }
    public int Count { get; init; }
}