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

