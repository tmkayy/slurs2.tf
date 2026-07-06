using System.Text.Json.Serialization;
using Refit;

namespace slurs2.backend.ApiClients;

public interface IClassifierApi
{
    [Post("/classify-batch")]
    Task<List<ClassifierResponse>> ClassifyBatch([Body] ClassifierBatchRequest request);

    public class ClassifierBatchRequest
    {
        [JsonPropertyName("texts")]
        public List<string> Texts { get; set; } = [];
    }
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