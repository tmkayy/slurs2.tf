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

builder.Services.AddRefitClient<IClassifierApi>(refitSettings)
    .ConfigureHttpClient(c => c.BaseAddress = new Uri(
        builder.Configuration["ClassifierUrl"] ?? "http://localhost:8000"));

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddSingleton<SlurDetectorService>();
builder.Services.AddSingleton<ScanProgressTracker>();
builder.Services.AddScoped<LogsFetcherService>();
builder.Services.AddScoped<PlayerService>();
builder.Services.AddScoped<PlayerScannerService>();

var app = builder.Build();

app.UseCors();

app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

app.Run();

