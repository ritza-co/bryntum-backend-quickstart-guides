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

        private async Task<List<IdMapping>?> ApplyEventChanges(StoreChanges<Event> changes)
        {
            List<IdMapping>? rows = null;

            if (changes.Added != null && changes.Added.Count > 0)
            {
                rows = new List<IdMapping>();
                foreach (var newEvent in changes.Added)
                {
                    // Reset Id to 0 for new events (will be auto-generated)
                    newEvent.Id = 0;
                    // Ensure Name is not null (required field)
                    if (newEvent.Name == null) newEvent.Name = "";

                    _context.Events.Add(newEvent);
                    await _context.SaveChangesAsync();

                    rows.Add(new IdMapping
                    {
                        PhantomId = newEvent.PhantomId,
                        Id = newEvent.Id
                    });
                }
            }

            if (changes.Updated != null && changes.Updated.Count > 0)
            {
                foreach (var eventUpdate in changes.Updated)
                {
                    if (eventUpdate.Id > 0)
                    {
                        var existingEvent = await _context.Events.FindAsync(eventUpdate.Id);
                        if (existingEvent != null)
                        {
                            // Update only non-null fields (partial update)
                            if (eventUpdate.Name != null) existingEvent.Name = eventUpdate.Name;
                            
                            // If dates are updated but duration is not explicitly provided, clear duration
                            // so calendar calculates it from the dates
                            bool datesUpdated = false;
                            if (eventUpdate.StartDate.HasValue)
                            {
                                existingEvent.StartDate = eventUpdate.StartDate;
                                datesUpdated = true;
                            }
                            if (eventUpdate.EndDate.HasValue)
                            {
                                existingEvent.EndDate = eventUpdate.EndDate;
                                datesUpdated = true;
                            }
                            
                            if (eventUpdate.AllDay.HasValue) existingEvent.AllDay = eventUpdate.AllDay;
                            if (eventUpdate.ResourceId != null) existingEvent.ResourceId = eventUpdate.ResourceId;
                            if (eventUpdate.EventColor != null) existingEvent.EventColor = eventUpdate.EventColor;
                            if (eventUpdate.ReadOnly.HasValue) existingEvent.ReadOnly = eventUpdate.ReadOnly;
                            if (eventUpdate.TimeZone != null) existingEvent.TimeZone = eventUpdate.TimeZone;
                            if (eventUpdate.Draggable.HasValue) existingEvent.Draggable = eventUpdate.Draggable;
                            if (eventUpdate.Resizable != null) existingEvent.Resizable = eventUpdate.Resizable;
                            
                            // Handle duration: if dates were updated and duration not explicitly provided, clear it
                            if (eventUpdate.Duration.HasValue)
                            {
                                existingEvent.Duration = eventUpdate.Duration;
                            }
                            else if (datesUpdated)
                            {
                                // Dates updated but duration not provided - clear it so calendar calculates from dates
                                existingEvent.Duration = null;
                            }
                            
                            if (eventUpdate.DurationUnit != null) existingEvent.DurationUnit = eventUpdate.DurationUnit;
                            if (eventUpdate.ExceptionDates != null) existingEvent.ExceptionDates = eventUpdate.ExceptionDates;
                            if (eventUpdate.RecurrenceRule != null) existingEvent.RecurrenceRule = eventUpdate.RecurrenceRule;
                            if (eventUpdate.Cls != null) existingEvent.Cls = eventUpdate.Cls;
                            if (eventUpdate.EventStyle != null) existingEvent.EventStyle = eventUpdate.EventStyle;
                            if (eventUpdate.IconCls != null) existingEvent.IconCls = eventUpdate.IconCls;
                            if (eventUpdate.Style != null) existingEvent.Style = eventUpdate.Style;

                            await _context.SaveChangesAsync();
                        }
                    }
                }
            }

            if (changes.Removed != null && changes.Removed.Count > 0)
            {
                foreach (var eventToRemove in changes.Removed)
                {
                    if (eventToRemove.Id > 0)
                    {
                        var existingEvent = await _context.Events.FindAsync(eventToRemove.Id);
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

        private async Task<List<IdMapping>?> ApplyResourceChanges(StoreChanges<Resource> changes)
        {
            List<IdMapping>? rows = null;

            if (changes.Added != null && changes.Added.Count > 0)
            {
                rows = new List<IdMapping>();
                foreach (var newResource in changes.Added)
                {
                    // Generate ID if not provided
                    if (string.IsNullOrEmpty(newResource.Id))
                    {
                        newResource.Id = Guid.NewGuid().ToString();
                    }
                    // Ensure Name is not null (required field)
                    if (newResource.Name == null) newResource.Name = "";

                    _context.Resources.Add(newResource);
                    await _context.SaveChangesAsync();

                    rows.Add(new IdMapping
                    {
                        PhantomId = newResource.PhantomId,
                        Id = newResource.Id
                    });
                }
            }

            if (changes.Updated != null && changes.Updated.Count > 0)
            {
                foreach (var resourceUpdate in changes.Updated)
                {
                    if (!string.IsNullOrEmpty(resourceUpdate.Id))
                    {
                        var existingResource = await _context.Resources.FindAsync(resourceUpdate.Id);
                        if (existingResource != null)
                        {
                            // Update only non-null fields (partial update)
                            if (resourceUpdate.Name != null) existingResource.Name = resourceUpdate.Name;
                            if (resourceUpdate.EventColor != null) existingResource.EventColor = resourceUpdate.EventColor;
                            if (resourceUpdate.ReadOnly.HasValue) existingResource.ReadOnly = resourceUpdate.ReadOnly;

                            await _context.SaveChangesAsync();
                        }
                    }
                }
            }

            if (changes.Removed != null && changes.Removed.Count > 0)
            {
                foreach (var resourceToRemove in changes.Removed)
                {
                    if (!string.IsNullOrEmpty(resourceToRemove.Id))
                    {
                        var existingResource = await _context.Resources.FindAsync(resourceToRemove.Id);
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

