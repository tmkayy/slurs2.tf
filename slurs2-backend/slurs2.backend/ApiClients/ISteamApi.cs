using Refit;
using slurs2.backend.ApiResponses;

namespace slurs2.backend.ApiClients;

public interface ISteamApi
{
    [Get("/ISteamUser/GetPlayerSummaries/v0002/")]
    Task<SteamPlayerSummaryResponse> GetPlayerSummaries(
        [AliasAs("key")] string apiKey,
        [AliasAs("steamids")] string steamId);
}