using System.Text.Json.Serialization;
using Refit;

namespace slurs2.backend.ApiClients;

public interface IClassifierApi
{
    [Post("/classify")]
    Task<ClassifierResponse> Classify([Body] ClassifierRequest request);
}

public class ClassifierRequest
{
    [JsonPropertyName("text")]
    public string Text { get; set; } = null!;
}

public class ClassifierResponse
{
    public string Label { get; set; } = null!;
    public float Score { get; set; }
}