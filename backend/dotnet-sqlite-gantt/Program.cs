using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using GanttApi.Data;
using GanttApi.Models;

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
builder.Services.AddDbContext<GanttContext>(options =>
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
    var context = scope.ServiceProvider.GetRequiredService<GanttContext>();
    context.Database.EnsureCreated();
}

app.UseAuthorization();
app.MapControllers();

app.Run();

// Seeding function
static async Task SeedDatabase(WebApplication app)
{
    using var scope = app.Services.CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<GanttContext>();

    // Drop existing tables and recreate
    await context.Database.EnsureDeletedAsync();
    await context.Database.EnsureCreatedAsync();
    Console.WriteLine("Database recreated.");

    // Read JSON data from example files
    var basePath = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..", "example-json-data", "gantt"));

    var tasksJsonPath = Path.Combine(basePath, "tasks.json");
    var dependenciesJsonPath = Path.Combine(basePath, "dependencies.json");

    Console.WriteLine($"Reading tasks from: {tasksJsonPath}");
    Console.WriteLine($"Reading dependencies from: {dependenciesJsonPath}");

    var options = new JsonSerializerOptions
    {
        PropertyNameCaseInsensitive = true
    };

    // Seed tasks
    var tasksJson = await File.ReadAllTextAsync(tasksJsonPath);
    var tasks = JsonSerializer.Deserialize<List<GanttTask>>(tasksJson, options);

    if (tasks != null && tasks.Count > 0)
    {
        await context.Tasks.AddRangeAsync(tasks);
        await context.SaveChangesAsync();
        Console.WriteLine($"Added {tasks.Count} tasks.");
    }

    // Seed dependencies
    var dependenciesJson = await File.ReadAllTextAsync(dependenciesJsonPath);
    var dependencies = JsonSerializer.Deserialize<List<GanttDependency>>(dependenciesJson, options);

    if (dependencies != null && dependencies.Count > 0)
    {
        await context.Dependencies.AddRangeAsync(dependencies);
        await context.SaveChangesAsync();
        Console.WriteLine($"Added {dependencies.Count} dependencies.");
    }

    Console.WriteLine("Database seeded successfully!");
}
