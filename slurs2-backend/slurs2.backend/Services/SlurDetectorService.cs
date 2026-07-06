using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using slurs2.backend.ApiClients;
using slurs2.backend.Models;

namespace slurs2.backend.Services;

public class SlurDetectorService(IClassifierApi classifierApi)
{
    private class SlurList
    {
        public List<string> SpicyWords { get; init; } = [];
    }
    
    private static readonly HashSet<string> ExactMatchWords = ["hell"];

    private record SlurPattern(Regex Pattern);
    private readonly List<SlurPattern> _spicyPatterns = LoadSpicyPatterns();

    private static List<SlurPattern> LoadSpicyPatterns()
    {
        var path = Path.Combine(AppContext.BaseDirectory, "slurs.json");
        var json = File.ReadAllText(path);
        var data = JsonSerializer.Deserialize<SlurList>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        })!;

        return data.SpicyWords.Select(w => new SlurPattern(BuildPattern(w))).ToList();
    }

    private static Regex BuildPattern(string word)
    {
        var sb = new StringBuilder();
        foreach (var c in word)
        {
            switch (char.ToLower(c))
            {
                case 'a': sb.Append("[a@4]"); break;
                case 'e': sb.Append("[e3]"); break;
                case 'i': sb.Append("[i1!]"); break;
                case 'o': sb.Append("[o0]"); break;
                case 'u': sb.Append("[u]"); break;
                case 'g': sb.Append("[g9]"); break;
                case 's': sb.Append("[s$5]"); break;
                case ' ': sb.Append(@"[\s\-_]*"); break;
                default: sb.Append(Regex.Escape(c.ToString())); break;
            }
        }
        var pattern = word.Contains(' ') || ExactMatchWords.Contains(word.ToLower())
            ? $@"\b{sb}\b"
            : $@"\b{sb}\w*";
        return new Regex(pattern, RegexOptions.IgnoreCase | RegexOptions.Compiled);
    }

    public async Task<List<SlurDetectionResult>> AnalyzeBatchAsync(List<string> messages)
    {
        var spicyCounts = messages.Select(m => _spicyPatterns
            .Sum(p => p.Pattern.Matches(m).Count)).ToList();

        try
        {
            var classifications = await classifierApi.ClassifyBatch(
                new IClassifierApi.ClassifierBatchRequest { Texts = messages });
            
            return messages.Select((_, i) =>
            {
                var isSlur = classifications[i].Label == "HATE" && classifications[i].Score > 0.80f;
                if (isSlur)
                    return new SlurDetectionResult { Found = true, Type = SlurType.Slur, Count = Math.Max(1, spicyCounts[i]) };
                if (spicyCounts[i] > 0)
                    return new SlurDetectionResult { Found = true, Type = SlurType.SpicyWord, Count = spicyCounts[i] };
                return new SlurDetectionResult { Found = false, Type = null, Count = 0 };
            }).ToList();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Classifier failed: {ex.Message}");
            return messages.Select((_,i) =>
                spicyCounts[i]>0 ?
                    new SlurDetectionResult {Found = true, Type = SlurType.SpicyWord, Count = spicyCounts[i]}
                    : new SlurDetectionResult {Found = false, Type = null, Count = 0}).ToList();
        }
    }
}