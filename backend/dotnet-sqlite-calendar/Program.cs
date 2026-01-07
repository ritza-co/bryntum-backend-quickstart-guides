using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using CalendarApi.Data;
using CalendarApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
        options.JsonSerializerOptions.NumberHandling = JsonNumberHandling.AllowReadingFromString;
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    });
builder.Services.AddEndpointsApiExplorer();

// Configure EF Core to use SQLite
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<CalendarContext>(options =>
    options.UseSqlite(connectionString)
);

// Add CORS service - Make sure this is before app.Build()
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// Check if we're running in seed mode
if (args.Contains("--seed"))
{
    await SeedDatabase(app);
    return;
}

// Enable CORS - This MUST be early in the middleware pipeline
app.UseCors("AllowFrontend");

// Ensure database is created
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<CalendarContext>();
    context.Database.EnsureCreated();
}

app.UseAuthorization();
app.MapControllers();

app.Run();

// Seeding function
static async Task SeedDatabase(WebApplication app)
{
    using var scope = app.Services.CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<CalendarContext>();

    // Drop existing tables and recreate
    await context.Database.EnsureDeletedAsync();
    await context.Database.EnsureCreatedAsync();
    Console.WriteLine("Database recreated.");

    // Read JSON data from example files
    var basePath = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..", "example-json-data", "calendar"));
    
    var eventsJsonPath = Path.Combine(basePath, "events.json");
    var resourcesJsonPath = Path.Combine(basePath, "resources.json");

    Console.WriteLine($"Reading events from: {eventsJsonPath}");
    Console.WriteLine($"Reading resources from: {resourcesJsonPath}");

    var eventsJson = await File.ReadAllTextAsync(eventsJsonPath);
    var resourcesJson = await File.ReadAllTextAsync(resourcesJsonPath);

    var options = new JsonSerializerOptions
    {
        PropertyNameCaseInsensitive = true
    };

    var events = JsonSerializer.Deserialize<List<Event>>(eventsJson, options);
    var resources = JsonSerializer.Deserialize<List<Resource>>(resourcesJson, options);

    if (resources != null && resources.Count > 0)
    {
        await context.Resources.AddRangeAsync(resources);
        await context.SaveChangesAsync();
        Console.WriteLine($"Added {resources.Count} resources.");
    }

    if (events != null && events.Count > 0)
    {
        await context.Events.AddRangeAsync(events);
        await context.SaveChangesAsync();
        Console.WriteLine($"Added {events.Count} events.");
    }

    Console.WriteLine("Database seeded successfully!");
}
