namespace slurs2.backend.ApiResponses;

public class LogResponse
{
    public List<ChatMessage> Chat { get; set; } = [];
}

public class ChatMessage
{
    public string Steamid { get; set; } = null!;
    public string Msg { get; set; } = null!;
}