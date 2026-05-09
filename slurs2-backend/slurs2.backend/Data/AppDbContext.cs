using Microsoft.EntityFrameworkCore;
using slurs2.backend.Models;

namespace slurs2.backend.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Player> Players { get; set; }
    
    public DbSet<ProcessedLog> ProcessedLogs { get; set; }
    
    public DbSet<SlurInstance> SlurInstances { get; set; }
}