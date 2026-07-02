using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Refit;
using slurs2.backend.ApiClients;
using slurs2.backend.Data;
using slurs2.backend.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

var refitSettings = new RefitSettings
{
    ContentSerializer = new SystemTextJsonContentSerializer(new JsonSerializerOptions
    {
        PropertyNameCaseInsensitive = true
    })
};

builder.Services.AddRefitClient<ILogsApi>(refitSettings)
    .ConfigureHttpClient(c => c.BaseAddress = new Uri("https://logs.tf"));

builder.Services.AddRefitClient<ISteamApi>(refitSettings)
    .ConfigureHttpClient(c => c.BaseAddress = new Uri("https://api.steampowered.com"));

builder.Services.AddSingleton<SlurDetectorService>();
builder.Services.AddScoped<LogsFetcherService>();
builder.Services.AddScoped<PlayerService>();
builder.Services.AddScoped<PlayerScannerService>();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173") // Vite's default port
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseCors();

app.MapControllers();

app.Run();

