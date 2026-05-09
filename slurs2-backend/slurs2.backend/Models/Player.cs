using System.ComponentModel.DataAnnotations;

namespace slurs2.backend.Models;

public class Player
{
    [Key]
    [MaxLength(32)]
    public string SteamId { get; set; } = null!;

    [Required]
    [MaxLength(64)]
    public string SteamName { get; set; } = null!;

    [MaxLength(64)]
    public string? Country { get; set; }

    public ICollection<SlurInstance> SlurInstances { get; set; } = [];
    
}