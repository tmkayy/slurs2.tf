using Microsoft.EntityFrameworkCore;
using Refit;
using slurs2.backend.ApiClients;
using slurs2.backend.Data;
using slurs2.backend.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddRefitClient<ILogsApi>()
    .ConfigureHttpClient(c => c.BaseAddress = new Uri("https://logs.tf"));

builder.Services.AddRefitClient<ISteamApi>()
    .ConfigureHttpClient(c => c.BaseAddress = new Uri("https://api.steampowered.com"));

builder.Services.AddRefitClient<IEtf2lApi>()
    .ConfigureHttpClient(c => c.BaseAddress = new Uri("https://api.etf2l.org"));

builder.Services.AddSingleton<SlurDetectorService>();
builder.Services.AddScoped<LogsFetcherService>();
builder.Services.AddScoped<PlayerService>();
builder.Services.AddScoped<PlayerScannerService>();

var app = builder.Build();

app.MapControllers();

app.Run();

