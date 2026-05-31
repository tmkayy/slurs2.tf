namespace slurs2.backend.ApiResponses;

public class LogSearchResponse
{
    public bool Success { get; set; }
    public List<LogSearchResult> Logs { get; set; } = [];
}

public class LogSearchResult
{
    public int Id { get; set; }
    public int Date { get; set; }
}