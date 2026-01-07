# How to create a Bryntum Calendar with .NET Core, SQLite and Vanilla JavaScript

This guide shows how to create a complete CRUD Calendar application using a Vanilla JavaScript Bryntum Calendar frontend and a .NET Core backend with Entity Framework Core connected to a local SQLite database.

## Quick setup (Run the existing app)

### Prerequisites

- Node.js version 20 or higher
- .NET 9.0 SDK

### Install and run backend

```bash
cd backend/dotnet-sqlite-calendar
dotnet restore
dotnet run -- --seed  # Seed the database (only needed once)
dotnet run            # Start the server
```

Backend runs on http://localhost:1337

### Install and run frontend

```bash
cd frontend/calendar-vanilla
npm install
npm run dev
```

Frontend runs on http://localhost:5173

## Build from scratch

### Backend setup

#### Initialize backend

```bash
mkdir calendar-dotnet-sqlite-vanilla
cd calendar-dotnet-sqlite-vanilla
mkdir backend
cd backend
dotnet new webapi -n CalendarApi -o .
rm Controllers/WeatherForecastController.cs  # Remove default controller
rm WeatherForecast.cs  # Remove default model
```

#### Update project file

Update `CalendarApi.csproj`:

```xml
<Project Sdk="Microsoft.NET.Sdk.Web">

  <PropertyGroup>
    <TargetFramework>net9.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <RootNamespace>CalendarApi</RootNamespace>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.AspNetCore.OpenApi" Version="9.0.0" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.Sqlite" Version="9.0.0" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="9.0.0">
      <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
      <PrivateAssets>all</PrivateAssets>
    </PackageReference>
  </ItemGroup>

</Project>
```

#### Install dependencies

```bash
dotnet restore
```

#### Configure application settings

Create `appsettings.json`:

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=calendar.sqlite3"
  }
}
```

Create `Properties/launchSettings.json`:

```json
{
  "$schema": "http://json.schemastore.org/launchsettings.json",
  "profiles": {
    "http": {
      "commandName": "Project",
      "dotnetRunMessages": true,
      "launchBrowser": false,
      "applicationUrl": "http://localhost:1337",
      "environmentVariables": {
        "ASPNETCORE_ENVIRONMENT": "Development"
      }
    }
  }
}
```

#### Example data

The seeding code reads example data directly from JSON files. The expected data structure:

**Events** (`events.json`):

```json
[
  {
    "id": 1,
    "startDate": "2026-07-20T14:00:00",
    "endDate": "2026-07-27T12:00:00",
    "name": "Hackathon 2026",
    "allDay": true,
    "resourceId": "bryntum",
    "eventColor": "green"
  },
  ...
]
```

**Resources** (`resources.json`):

```json
[
  {
    "id": "bryntum",
    "name": "Bryntum team",
    "eventColor": "blue"
  },
  ...
]
```

> **Note**: The seeding function in `Program.cs` reads these files from a relative path. Adjust the path in the `SeedDatabase` function to match your project structure.

#### Create Entity Framework models

Create `Models/Event.cs`:

```csharp
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace CalendarApi.Models
{
    [Table("events")]
    public class Event
    {
        [Key]
        [Column("id")]
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [Required]
        [Column("name")]
        [JsonPropertyName("name")]
        public string Name { get; set; } = null!;

        [Column("startDate")]
        [JsonPropertyName("startDate")]
        public DateTime? StartDate { get; set; }

        [Column("endDate")]
        [JsonPropertyName("endDate")]
        public DateTime? EndDate { get; set; }

        [Column("allDay")]
        [JsonPropertyName("allDay")]
        public bool? AllDay { get; set; } = false;

        [Column("resourceId")]
        [JsonPropertyName("resourceId")]
        public string? ResourceId { get; set; }

        [Column("eventColor")]
        [JsonPropertyName("eventColor")]
        public string? EventColor { get; set; }

        [Column("readOnly")]
        [JsonPropertyName("readOnly")]
        public bool? ReadOnly { get; set; } = false;

        [Column("timeZone")]
        [JsonPropertyName("timeZone")]
        public string? TimeZone { get; set; }

        [Column("draggable")]
        [JsonPropertyName("draggable")]
        public bool? Draggable { get; set; } = true;

        [Column("resizable")]
        [JsonPropertyName("resizable")]
        public string? Resizable { get; set; } = "true";

        [Column("duration")]
        [JsonPropertyName("duration")]
        public double? Duration { get; set; }

        [Column("durationUnit")]
        [JsonPropertyName("durationUnit")]
        public string? DurationUnit { get; set; } = "day";

        [Column("exceptionDates")]
        [JsonPropertyName("exceptionDates")]
        [JsonConverter(typeof(JsonStringToArrayConverter))]
        public string? ExceptionDates { get; set; }

        [Column("recurrenceRule")]
        [JsonPropertyName("recurrenceRule")]
        public string? RecurrenceRule { get; set; }

        [Column("cls")]
        [JsonPropertyName("cls")]
        public string? Cls { get; set; }

        [Column("eventStyle")]
        [JsonPropertyName("eventStyle")]
        public string? EventStyle { get; set; }

        [Column("iconCls")]
        [JsonPropertyName("iconCls")]
        public string? IconCls { get; set; }

        [Column("style")]
        [JsonPropertyName("style")]
        public string? Style { get; set; }
    }
}
```

Create `Models/Resource.cs`:

```csharp
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace CalendarApi.Models
{
    [Table("resources")]
    public class Resource
    {
        [Key]
        [Column("id")]
        [JsonPropertyName("id")]
        public string Id { get; set; } = null!;

        [Required]
        [Column("name")]
        [JsonPropertyName("name")]
        public string Name { get; set; } = null!;

        [Column("eventColor")]
        [JsonPropertyName("eventColor")]
        public string? EventColor { get; set; }

        [Column("readOnly")]
        [JsonPropertyName("readOnly")]
        public bool? ReadOnly { get; set; } = false;
    }
}
```

Create `Models/JsonStringToArrayConverter.cs`:

```csharp
using System.Text.Json;
using System.Text.Json.Serialization;

namespace CalendarApi.Models
{
    /// <summary>
    /// Converts a JSON string stored in the database to an array when serializing for API responses.
    /// E.g., stored as "[]" or "[\"2025-01-01\"]" -> serialized as [] or ["2025-01-01"]
    /// </summary>
    public class JsonStringToArrayConverter : JsonConverter<string?>
    {
        public override string? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            // When reading from JSON (e.g., from request), we might get an array or string
            if (reader.TokenType == JsonTokenType.Null)
            {
                return null;
            }
            
            if (reader.TokenType == JsonTokenType.StartArray)
            {
                // Read the array and convert to JSON string for storage
                using var doc = JsonDocument.ParseValue(ref reader);
                return doc.RootElement.GetRawText();
            }
            
            // If it's already a string, return as-is
            return reader.GetString();
        }

        public override void Write(Utf8JsonWriter writer, string? value, JsonSerializerOptions options)
        {
            if (value == null)
            {
                writer.WriteNullValue();
                return;
            }

            // Parse the JSON string and write it as raw JSON (array)
            try
            {
                using var doc = JsonDocument.Parse(value);
                doc.RootElement.WriteTo(writer);
            }
            catch
            {
                // If parsing fails, write as null
                writer.WriteNullValue();
            }
        }
    }
}
```

Create `Models/SyncModels.cs` with DTOs for sync requests and responses:

```csharp
using System.Text.Json.Serialization;

namespace CalendarApi.Models
{
    // Request DTOs
    public class SyncRequest
    {
        [JsonPropertyName("requestId")]
        public long? RequestId { get; set; }

        [JsonPropertyName("events")]
        public StoreChanges<EventData>? Events { get; set; }

        [JsonPropertyName("resources")]
        public StoreChanges<ResourceData>? Resources { get; set; }
    }

    public class StoreChanges<T>
    {
        [JsonPropertyName("added")]
        public List<T>? Added { get; set; }

        [JsonPropertyName("updated")]
        public List<T>? Updated { get; set; }

        [JsonPropertyName("removed")]
        public List<T>? Removed { get; set; }
    }

    public class EventData
    {
        [JsonPropertyName("$PhantomId")]
        public string? PhantomId { get; set; }

        [JsonPropertyName("id")]
        public int? Id { get; set; }

        [JsonPropertyName("name")]
        public string? Name { get; set; }

        [JsonPropertyName("startDate")]
        public DateTime? StartDate { get; set; }

        [JsonPropertyName("endDate")]
        public DateTime? EndDate { get; set; }

        [JsonPropertyName("allDay")]
        public bool? AllDay { get; set; }

        [JsonPropertyName("resourceId")]
        public string? ResourceId { get; set; }

        [JsonPropertyName("eventColor")]
        public string? EventColor { get; set; }

        [JsonPropertyName("readOnly")]
        public bool? ReadOnly { get; set; }

        [JsonPropertyName("timeZone")]
        public string? TimeZone { get; set; }

        [JsonPropertyName("draggable")]
        public bool? Draggable { get; set; }

        [JsonPropertyName("resizable")]
        public string? Resizable { get; set; }

        [JsonPropertyName("duration")]
        public double? Duration { get; set; }

        [JsonPropertyName("durationUnit")]
        public string? DurationUnit { get; set; }

        [JsonPropertyName("exceptionDates")]
        public List<string>? ExceptionDates { get; set; }

        [JsonPropertyName("recurrenceRule")]
        public string? RecurrenceRule { get; set; }

        [JsonPropertyName("cls")]
        public string? Cls { get; set; }

        [JsonPropertyName("eventStyle")]
        public string? EventStyle { get; set; }

        [JsonPropertyName("iconCls")]
        public string? IconCls { get; set; }

        [JsonPropertyName("style")]
        public string? Style { get; set; }
    }

    public class ResourceData
    {
        [JsonPropertyName("$PhantomId")]
        public string? PhantomId { get; set; }

        [JsonPropertyName("id")]
        public string? Id { get; set; }

        [JsonPropertyName("name")]
        public string? Name { get; set; }

        [JsonPropertyName("eventColor")]
        public string? EventColor { get; set; }

        [JsonPropertyName("readOnly")]
        public bool? ReadOnly { get; set; }
    }

    // Response DTOs
    public class LoadResponse
    {
        [JsonPropertyName("events")]
        public StoreData<Event>? Events { get; set; }

        [JsonPropertyName("resources")]
        public StoreData<Resource>? Resources { get; set; }
    }

    public class StoreData<T>
    {
        [JsonPropertyName("rows")]
        public List<T> Rows { get; set; } = new List<T>();
    }

    public class SyncResponse
    {
        [JsonPropertyName("requestId")]
        public long? RequestId { get; set; }

        [JsonPropertyName("success")]
        public bool Success { get; set; }

        [JsonPropertyName("message")]
        public string? Message { get; set; }

        [JsonPropertyName("events")]
        public SyncStoreResponse? Events { get; set; }

        [JsonPropertyName("resources")]
        public SyncStoreResponse? Resources { get; set; }
    }

    public class SyncStoreResponse
    {
        [JsonPropertyName("rows")]
        public List<IdMapping>? Rows { get; set; }
    }

    public class IdMapping
    {
        [JsonPropertyName("$PhantomId")]
        public string? PhantomId { get; set; }

        [JsonPropertyName("id")]
        public object? Id { get; set; }
    }
}
```

#### Create database context

Create `Data/CalendarContext.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using CalendarApi.Models;

namespace CalendarApi.Data
{
    public class CalendarContext : DbContext
    {
        public CalendarContext(DbContextOptions<CalendarContext> options) : base(options) { }

        public DbSet<Event> Events { get; set; } = null!;
        public DbSet<Resource> Resources { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Event>()
                .ToTable("events")
                .HasKey(e => e.Id);

            modelBuilder.Entity<Resource>()
                .ToTable("resources")
                .HasKey(r => r.Id);
        }
    }
}
```

#### Create API controller

Create `Controllers/CalendarController.cs`:

```csharp
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CalendarApi.Data;
using CalendarApi.Models;

namespace CalendarApi.Controllers
{
    [ApiController]
    [Route("api")]
    public class CalendarController : ControllerBase
    {
        private readonly CalendarContext _context;
        private readonly ILogger<CalendarController> _logger;

        public CalendarController(CalendarContext context, ILogger<CalendarController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet("load")]
        public async Task<ActionResult<LoadResponse>> Load()
        {
            try
            {
                var eventsTask = _context.Events.ToListAsync();
                var resourcesTask = _context.Resources.ToListAsync();

                await Task.WhenAll(eventsTask, resourcesTask);

                var response = new LoadResponse
                {
                    Events = new StoreData<Event> { Rows = eventsTask.Result },
                    Resources = new StoreData<Resource> { Rows = resourcesTask.Result }
                };

                _logger.LogInformation("Loaded {EventCount} events and {ResourceCount} resources",
                    eventsTask.Result.Count, resourcesTask.Result.Count);

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading data");
                return StatusCode(500, new { success = false, message = "There was an error loading the events and resources data." });
            }
        }

        [HttpPost("sync")]
        public async Task<ActionResult<SyncResponse>> Sync([FromBody] SyncRequest request)
        {
            _logger.LogInformation("Sync request received. RequestId: {RequestId}", request.RequestId);
            
            try
            {
                var response = new SyncResponse
                {
                    RequestId = request.RequestId,
                    Success = true
                };

                if (request.Resources != null)
                {
                    var rows = await ApplyResourceChanges(request.Resources);
                    if (rows != null && rows.Count > 0)
                    {
                        response.Resources = new SyncStoreResponse { Rows = rows };
                    }
                }

                if (request.Events != null)
                {
                    var rows = await ApplyEventChanges(request.Events);
                    if (rows != null && rows.Count > 0)
                    {
                        response.Events = new SyncStoreResponse { Rows = rows };
                    }
                }

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error syncing data");
                return StatusCode(500, new SyncResponse
                {
                    RequestId = request.RequestId,
                    Success = false,
                    Message = "There was an error syncing the data changes."
                });
            }
        }

        private async Task<List<IdMapping>?> ApplyEventChanges(StoreChanges<EventData> changes)
        {
            List<IdMapping>? rows = null;

            if (changes.Added != null && changes.Added.Count > 0)
            {
                rows = new List<IdMapping>();
                foreach (var eventData in changes.Added)
                {
                    var newEvent = new Event
                    {
                        Name = eventData.Name ?? "",
                        StartDate = eventData.StartDate,
                        EndDate = eventData.EndDate,
                        AllDay = eventData.AllDay,
                        ResourceId = eventData.ResourceId,
                        EventColor = eventData.EventColor,
                        ReadOnly = eventData.ReadOnly,
                        TimeZone = eventData.TimeZone,
                        Draggable = eventData.Draggable,
                        Resizable = eventData.Resizable,
                        Duration = eventData.Duration,
                        DurationUnit = eventData.DurationUnit,
                        ExceptionDates = eventData.ExceptionDates != null ? JsonSerializer.Serialize(eventData.ExceptionDates) : null,
                        RecurrenceRule = eventData.RecurrenceRule,
                        Cls = eventData.Cls,
                        EventStyle = eventData.EventStyle,
                        IconCls = eventData.IconCls,
                        Style = eventData.Style
                    };

                    _context.Events.Add(newEvent);
                    await _context.SaveChangesAsync();

                    rows.Add(new IdMapping
                    {
                        PhantomId = eventData.PhantomId,
                        Id = newEvent.Id
                    });
                }
            }

            if (changes.Updated != null && changes.Updated.Count > 0)
            {
                foreach (var eventData in changes.Updated)
                {
                    if (eventData.Id.HasValue)
                    {
                        var existingEvent = await _context.Events.FindAsync(eventData.Id.Value);
                        if (existingEvent != null)
                        {
                            if (eventData.Name != null) existingEvent.Name = eventData.Name;
                            if (eventData.StartDate.HasValue) existingEvent.StartDate = eventData.StartDate;
                            if (eventData.EndDate.HasValue) existingEvent.EndDate = eventData.EndDate;
                            if (eventData.AllDay.HasValue) existingEvent.AllDay = eventData.AllDay;
                            if (eventData.ResourceId != null) existingEvent.ResourceId = eventData.ResourceId;
                            if (eventData.EventColor != null) existingEvent.EventColor = eventData.EventColor;
                            if (eventData.ReadOnly.HasValue) existingEvent.ReadOnly = eventData.ReadOnly;
                            if (eventData.TimeZone != null) existingEvent.TimeZone = eventData.TimeZone;
                            if (eventData.Draggable.HasValue) existingEvent.Draggable = eventData.Draggable;
                            if (eventData.Resizable != null) existingEvent.Resizable = eventData.Resizable;
                            if (eventData.Duration.HasValue) existingEvent.Duration = eventData.Duration;
                            if (eventData.DurationUnit != null) existingEvent.DurationUnit = eventData.DurationUnit;
                            if (eventData.ExceptionDates != null) existingEvent.ExceptionDates = JsonSerializer.Serialize(eventData.ExceptionDates);
                            if (eventData.RecurrenceRule != null) existingEvent.RecurrenceRule = eventData.RecurrenceRule;
                            if (eventData.Cls != null) existingEvent.Cls = eventData.Cls;
                            if (eventData.EventStyle != null) existingEvent.EventStyle = eventData.EventStyle;
                            if (eventData.IconCls != null) existingEvent.IconCls = eventData.IconCls;
                            if (eventData.Style != null) existingEvent.Style = eventData.Style;

                            await _context.SaveChangesAsync();
                        }
                    }
                }
            }

            if (changes.Removed != null && changes.Removed.Count > 0)
            {
                foreach (var eventData in changes.Removed)
                {
                    if (eventData.Id.HasValue)
                    {
                        var existingEvent = await _context.Events.FindAsync(eventData.Id.Value);
                        if (existingEvent != null)
                        {
                            _context.Events.Remove(existingEvent);
                            await _context.SaveChangesAsync();
                        }
                    }
                }
            }

            return rows;
        }

        private async Task<List<IdMapping>?> ApplyResourceChanges(StoreChanges<ResourceData> changes)
        {
            List<IdMapping>? rows = null;

            if (changes.Added != null && changes.Added.Count > 0)
            {
                rows = new List<IdMapping>();
                foreach (var resourceData in changes.Added)
                {
                    var newResource = new Resource
                    {
                        Id = resourceData.Id ?? Guid.NewGuid().ToString(),
                        Name = resourceData.Name ?? "",
                        EventColor = resourceData.EventColor,
                        ReadOnly = resourceData.ReadOnly
                    };

                    _context.Resources.Add(newResource);
                    await _context.SaveChangesAsync();

                    rows.Add(new IdMapping
                    {
                        PhantomId = resourceData.PhantomId,
                        Id = newResource.Id
                    });
                }
            }

            if (changes.Updated != null && changes.Updated.Count > 0)
            {
                foreach (var resourceData in changes.Updated)
                {
                    if (resourceData.Id != null)
                    {
                        var existingResource = await _context.Resources.FindAsync(resourceData.Id);
                        if (existingResource != null)
                        {
                            if (resourceData.Name != null) existingResource.Name = resourceData.Name;
                            if (resourceData.EventColor != null) existingResource.EventColor = resourceData.EventColor;
                            if (resourceData.ReadOnly.HasValue) existingResource.ReadOnly = resourceData.ReadOnly;

                            await _context.SaveChangesAsync();
                        }
                    }
                }
            }

            if (changes.Removed != null && changes.Removed.Count > 0)
            {
                foreach (var resourceData in changes.Removed)
                {
                    if (resourceData.Id != null)
                    {
                        var existingResource = await _context.Resources.FindAsync(resourceData.Id);
                        if (existingResource != null)
                        {
                            _context.Resources.Remove(existingResource);
                            await _context.SaveChangesAsync();
                        }
                    }
                }
            }

            return rows;
        }
    }
}
```

#### Create application entry point

Update `Program.cs`:

```csharp
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
```

### Frontend setup

#### Initialize frontend

```bash
cd ../
mkdir frontend
cd frontend
npm create vite@latest . -- --template vanilla-ts
```

#### Install dependencies

```bash
npm install
```

Follow the guide to accessing the [Bryntum npm repository](https://bryntum.com/products/calendar/docs/guide/Calendar/npm-repository).

If you have a Bryntum Calendar license, install the Bryntum Calendar using the following command:

```shell
npm install @bryntum/calendar
```

If you don't have a Bryntum Calendar license, install the trial version:

```shell
npm install @bryntum/calendar@npm:@bryntum/calendar-trial
```

#### Create Calendar configuration

Create `src/calendarConfig.ts`:

```typescript
import { type CalendarConfig } from '@bryntum/calendar';

export const calendarConfig: CalendarConfig = {
    appendTo    : 'app',
    date        : new Date(2026, 6, 20),  // July 20, 2026 (month is 0-indexed)
    crudManager : {
        loadUrl          : 'http://localhost:1337/api/load',
        autoLoad         : true,
        syncUrl          : 'http://localhost:1337/api/sync',
        autoSync         : true,
        validateResponse : true
    }
};
```

#### Update main entry point

Update `src/main.ts`:

```typescript
import { Calendar } from '@bryntum/calendar';
import { calendarConfig } from './calendarConfig';
import './style.css';

const calendar = new Calendar(calendarConfig);
```

#### Update HTML

Update `index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>How to use a Bryntum Calendar with a backend API</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

#### Update CSS styles

Create `src/style.css`:

```css
@import "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap";
@import "@bryntum/calendar/fontawesome/css/fontawesome.css";
@import "@bryntum/calendar/fontawesome/css/solid.css";
/* Import calendar's structural CSS */
@import "@bryntum/calendar/calendar.css";
/* Import your preferred Bryntum theme */
@import "@bryntum/calendar/svalbard-light.css";

* {
    margin: 0;
}

body,
html {
    font-family: Poppins, "Open Sans", Helvetica, Arial, sans-serif;
}

#app {
    display: flex;
    flex-direction: column;
    height: 100vh;
    font-size: 14px;
}
```

### Run the application

```bash
# Terminal 1: Start backend
cd backend
dotnet run

# Terminal 2: Start frontend  
cd frontend
npm run dev
```

Visit http://localhost:5173 to see the Calendar.
