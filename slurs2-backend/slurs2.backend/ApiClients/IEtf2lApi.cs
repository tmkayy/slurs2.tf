using Refit;
using slurs2.backend.ApiResponses;

namespace slurs2.backend.ApiClients;

public interface IEtf2lApi
{
    [Get("/player/{steamId}")]
    Task<Etf2lPlayerResponse> GetPlayer(int steamId);
}