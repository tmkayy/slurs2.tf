namespace slurs2.backend.ApiResponses;

public class Etf2lPlayerResponse
{
    public Etf2lPlayer Player { get; set; } = null!;
}

//country is nested 
public class Etf2lPlayer
{
    public string Country { get; set; } = null!;
}