using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace slurs2.backend.Models;

public class ProcessedLog
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.None)]
    public int LogId { get; set; }
}