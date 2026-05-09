using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace slurs2.backend.Models;

public class SlurInstance
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }
    
    [Required]
    [MaxLength(256)]
    public string Message { get; set; } = null!;
    
    [Required]
    [ForeignKey(nameof(ProcessedLog))]
    public int LogId { get; set; }

    public ProcessedLog ProcessedLog { get; set; } = null!;
    
    [Required]
    [ForeignKey(nameof(Player))]
    [MaxLength(32)]
    public string PlayerSteamId { get; set; } = null!;
    
    public Player Player { get; set; } = null!;
    
    [Required]
    public int SlurCount { get; set; }
    
    [Required]
    public DateTime MessageDate { get; set; }
    
    [Required]
    public SlurType SlurType { get; set; }
}