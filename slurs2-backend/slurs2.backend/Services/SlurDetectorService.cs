using System.Text.Json;
using System.Text.RegularExpressions;
using slurs2.backend.Models;

namespace slurs2.backend.Services;

public class SlurDetectorService
{
    private class SlurList
    {
        public List<string> Slurs { get; init; } = [];
        public List<string> SpicyWords { get; init; } = [];
    }
    
    private static Regex BuildPattern(string word) =>
        new($@"\b{Regex.Escape(word)}\w*", RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private record SlurPattern(Regex Pattern, SlurType Type);

    private readonly List<SlurPattern> _patterns;

    public SlurDetectorService()
    {
        var path = Path.Combine(AppContext.BaseDirectory, "slurs.json");
        var json = File.ReadAllText(path);
        var data = JsonSerializer.Deserialize<SlurList>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        })!;

        _patterns = new List<SlurPattern>();

        foreach (var word in data.Slurs)
            _patterns.Add(new SlurPattern(BuildPattern(word), SlurType.Slur));

        foreach (var word in data.SpicyWords)
            _patterns.Add(new SlurPattern(BuildPattern(word), SlurType.SpicyWord));
    }

    public SlurDetectionResult Analyze(string message)
    {
        Console.WriteLine($"Analyzing: '{message}', patterns: {_patterns.Count}");
        foreach (var p in _patterns)
            Console.WriteLine($"  Pattern: {p.Pattern}, Type: {p.Type}");
        
        SlurType? highestType = null;
        int count = 0;

        foreach (var slurPattern in _patterns)
        {
            var matches = slurPattern.Pattern.Matches(message);
            if (matches.Count == 0) continue;

            count += matches.Count;

            if (highestType == null || slurPattern.Type == SlurType.Slur)
                highestType = slurPattern.Type;
        }

        return new SlurDetectionResult
        {
            Found = count > 0,
            Type = highestType,
            Count = count
        };
    }
}