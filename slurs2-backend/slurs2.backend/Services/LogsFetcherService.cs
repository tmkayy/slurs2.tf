using slurs2.backend.ApiClients;
using slurs2.backend.ApiResponses;

namespace slurs2.backend.Services;

public class LogsFetcherService(ILogsApi logsApi)
{
    public async Task<List<(int Id, int Date)>> GetLogIdsForPlayer(string steamId)
    {
        var response = await logsApi.SearchLogs(steamId);

        if (!response.Success)
            return [];

        return response.Logs.Select(l => (l.Id, l.Date)).ToList();
    }

    public async Task<List<ChatMessage>> GetChatMessages(int logId)
    {
        var response = await logsApi.GetLog(logId);
        return response.Chat;
    }
}