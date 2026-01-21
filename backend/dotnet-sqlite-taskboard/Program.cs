using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using TaskBoardApi.Data;
using TaskBoardApi.Models;

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
builder.Services.AddDbContext<TaskBoardContext>(options =>
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
    var context = scope.ServiceProvider.GetRequiredService<TaskBoardContext>();
    context.Database.EnsureCreated();
}

app.UseAuthorization();
app.MapControllers();

app.Run();

// Seeding function
static async Task SeedDatabase(WebApplication app)
{
    using var scope = app.Services.CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<TaskBoardContext>();

    // Drop existing tables and recreate
    await context.Database.EnsureDeletedAsync();
    await context.Database.EnsureCreatedAsync();
    Console.WriteLine("Database recreated.");

    // Read JSON data from example files
    var basePath = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..", "example-json-data", "taskboard"));

    var tasksJsonPath = Path.Combine(basePath, "tasks.json");
    var resourcesJsonPath = Path.Combine(basePath, "resources.json");
    var assignmentsJsonPath = Path.Combine(basePath, "assignments.json");

    Console.WriteLine($"Reading tasks from: {tasksJsonPath}");
    Console.WriteLine($"Reading resources from: {resourcesJsonPath}");
    Console.WriteLine($"Reading assignments from: {assignmentsJsonPath}");

    var tasksJson = await File.ReadAllTextAsync(tasksJsonPath);
    var resourcesJson = await File.ReadAllTextAsync(resourcesJsonPath);
    var assignmentsJson = await File.ReadAllTextAsync(assignmentsJsonPath);

    var options = new JsonSerializerOptions
    {
        PropertyNameCaseInsensitive = true
    };

    var tasks = JsonSerializer.Deserialize<List<TaskItem>>(tasksJson, options);
    var resources = JsonSerializer.Deserialize<List<Resource>>(resourcesJson, options);
    var assignments = JsonSerializer.Deserialize<List<Assignment>>(assignmentsJson, options);

    if (resources != null && resources.Count > 0)
    {
        await context.Resources.AddRangeAsync(resources);
        await context.SaveChangesAsync();
        Console.WriteLine($"Added {resources.Count} resources.");
    }

    if (tasks != null && tasks.Count > 0)
    {
        await context.Tasks.AddRangeAsync(tasks);
        await context.SaveChangesAsync();
        Console.WriteLine($"Added {tasks.Count} tasks.");
    }

    if (assignments != null && assignments.Count > 0)
    {
        await context.Assignments.AddRangeAsync(assignments);
        await context.SaveChangesAsync();
        Console.WriteLine($"Added {assignments.Count} assignments.");
    }

    Console.WriteLine("Database seeded successfully!");
}
