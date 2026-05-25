using Refit;
using slurs2.backend.ApiResponses;

namespace slurs2.backend.ApiClients;

public interface ILogsApi
{
    [Get("/json/{logId}")]
    Task<LogResponse> GetLog(int logId);
    
    [Get("/api/v1/log")]
    Task<LogSearchResponse> SearchLogs([AliasAs("player")] string steamId, [AliasAs("limit")] int limit = 10000);
}