using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchedulerProApi.Data;
using SchedulerProApi.Models;

namespace SchedulerProApi.Controllers
{
    [ApiController]
    [Route("api")]
    public class SchedulerProController : ControllerBase
    {
        private readonly SchedulerProContext _context;
        private readonly ILogger<SchedulerProController> _logger;

        public SchedulerProController(SchedulerProContext context, ILogger<SchedulerProController> logger)
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
                var assignmentsTask = _context.Assignments.ToListAsync();
                var dependenciesTask = _context.Dependencies.ToListAsync();

                await Task.WhenAll(eventsTask, resourcesTask, assignmentsTask, dependenciesTask);

                var response = new LoadResponse
                {
                    Events = new StoreData<Event> { Rows = eventsTask.Result },
                    Resources = new StoreData<Resource> { Rows = resourcesTask.Result },
                    Assignments = new StoreData<Assignment> { Rows = assignmentsTask.Result },
                    Dependencies = new StoreData<Dependency> { Rows = dependenciesTask.Result }
                };

                _logger.LogInformation("Loaded {EventCount} events, {ResourceCount} resources, {AssignmentCount} assignments, {DependencyCount} dependencies",
                    eventsTask.Result.Count, resourcesTask.Result.Count, assignmentsTask.Result.Count, dependenciesTask.Result.Count);

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading data");
                return StatusCode(500, new { success = false, message = "There was an error loading the assignments, dependencies, events, and resources data." });
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

                // Track event phantom ID mappings for assignments and dependencies
                var eventPhantomIdMap = new Dictionary<string, int>();

                // Process resources first
                if (request.Resources != null)
                {
                    var rows = await ApplyResourceChanges(request.Resources);
                    if (rows != null && rows.Count > 0)
                    {
                        response.Resources = new SyncStoreResponse { Rows = rows };
                    }
                }

                // Process events second (track phantom IDs)
                if (request.Events != null)
                {
                    var rows = await ApplyEventChanges(request.Events, eventPhantomIdMap);
                    if (rows != null && rows.Count > 0)
                    {
                        response.Events = new SyncStoreResponse { Rows = rows };
                    }
                }

                // Process assignments (use event phantom ID mappings)
                if (request.Assignments != null)
                {
                    var rows = await ApplyAssignmentChanges(request.Assignments, eventPhantomIdMap);
                    if (rows != null && rows.Count > 0)
                    {
                        response.Assignments = new SyncStoreResponse { Rows = rows };
                    }
                }

                // Process dependencies last
                if (request.Dependencies != null)
                {
                    var rows = await ApplyDependencyChanges(request.Dependencies, eventPhantomIdMap);
                    if (rows != null && rows.Count > 0)
                    {
                        response.Dependencies = new SyncStoreResponse { Rows = rows };
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

        private async Task<List<IdMapping>?> ApplyEventChanges(StoreChanges<Event> changes, Dictionary<string, int> phantomIdMap)
        {
            List<IdMapping>? rows = null;

            if (changes.Added != null && changes.Added.Count > 0)
            {
                rows = new List<IdMapping>();
                foreach (var newEvent in changes.Added)
                {
                    var phantomId = newEvent.PhantomId;
                    newEvent.Id = 0;
                    if (newEvent.Name == null) newEvent.Name = "";

                    _context.Events.Add(newEvent);
                    await _context.SaveChangesAsync();

                    if (!string.IsNullOrEmpty(phantomId))
                    {
                        phantomIdMap[phantomId] = newEvent.Id;
                    }

                    rows.Add(new IdMapping
                    {
                        PhantomId = phantomId,
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
                            if (eventUpdate.Name != null) existingEvent.Name = eventUpdate.Name;
                            if (eventUpdate.StartDate.HasValue) existingEvent.StartDate = eventUpdate.StartDate;
                            if (eventUpdate.EndDate.HasValue) existingEvent.EndDate = eventUpdate.EndDate;
                            if (eventUpdate.AllDay.HasValue) existingEvent.AllDay = eventUpdate.AllDay;
                            if (eventUpdate.Duration.HasValue) existingEvent.Duration = eventUpdate.Duration;
                            if (eventUpdate.DurationUnit != null) existingEvent.DurationUnit = eventUpdate.DurationUnit;
                            if (eventUpdate.ReadOnly.HasValue) existingEvent.ReadOnly = eventUpdate.ReadOnly;
                            if (eventUpdate.Draggable.HasValue) existingEvent.Draggable = eventUpdate.Draggable;
                            if (eventUpdate.Resizable != null) existingEvent.Resizable = eventUpdate.Resizable;
                            if (eventUpdate.TimeZone != null) existingEvent.TimeZone = eventUpdate.TimeZone;
                            if (eventUpdate.RecurrenceRule != null) existingEvent.RecurrenceRule = eventUpdate.RecurrenceRule;
                            if (eventUpdate.ExceptionDates != null) existingEvent.ExceptionDates = eventUpdate.ExceptionDates;
                            if (eventUpdate.Children != null) existingEvent.Children = eventUpdate.Children;
                            if (eventUpdate.Cls != null) existingEvent.Cls = eventUpdate.Cls;
                            if (eventUpdate.EventColor != null) existingEvent.EventColor = eventUpdate.EventColor;
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
                    var phantomId = newResource.PhantomId;
                    newResource.Id = 0;
                    if (newResource.Name == null) newResource.Name = "";

                    _context.Resources.Add(newResource);
                    await _context.SaveChangesAsync();

                    rows.Add(new IdMapping
                    {
                        PhantomId = phantomId,
                        Id = newResource.Id
                    });
                }
            }

            if (changes.Updated != null && changes.Updated.Count > 0)
            {
                foreach (var resourceUpdate in changes.Updated)
                {
                    if (resourceUpdate.Id > 0)
                    {
                        var existingResource = await _context.Resources.FindAsync(resourceUpdate.Id);
                        if (existingResource != null)
                        {
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
                    if (resourceToRemove.Id > 0)
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

        private async Task<List<IdMapping>?> ApplyAssignmentChanges(AssignmentStoreChanges changes, Dictionary<string, int> eventPhantomIdMap)
        {
            List<IdMapping>? rows = null;

            if (changes.Added != null && changes.Added.Count > 0)
            {
                rows = new List<IdMapping>();
                foreach (var dto in changes.Added)
                {
                    var phantomId = dto.PhantomId;
                    var newAssignment = dto.ToAssignment(eventPhantomIdMap);
                    newAssignment.Id = 0;

                    _context.Assignments.Add(newAssignment);
                    await _context.SaveChangesAsync();

                    rows.Add(new IdMapping
                    {
                        PhantomId = phantomId,
                        Id = newAssignment.Id
                    });
                }
            }

            if (changes.Updated != null && changes.Updated.Count > 0)
            {
                foreach (var dto in changes.Updated)
                {
                    var assignmentUpdate = dto.ToAssignment(eventPhantomIdMap);

                    if (assignmentUpdate.Id > 0)
                    {
                        var existingAssignment = await _context.Assignments.FindAsync(assignmentUpdate.Id);
                        if (existingAssignment != null)
                        {
                            if (assignmentUpdate.EventId > 0) existingAssignment.EventId = assignmentUpdate.EventId;
                            if (assignmentUpdate.ResourceId > 0) existingAssignment.ResourceId = assignmentUpdate.ResourceId;

                            await _context.SaveChangesAsync();
                        }
                    }
                }
            }

            if (changes.Removed != null && changes.Removed.Count > 0)
            {
                foreach (var dto in changes.Removed)
                {
                    if (dto.Id > 0)
                    {
                        var existingAssignment = await _context.Assignments.FindAsync(dto.Id);
                        if (existingAssignment != null)
                        {
                            _context.Assignments.Remove(existingAssignment);
                            await _context.SaveChangesAsync();
                        }
                    }
                }
            }

            return rows;
        }

        private async Task<List<IdMapping>?> ApplyDependencyChanges(StoreChanges<Dependency> changes, Dictionary<string, int> eventPhantomIdMap)
        {
            List<IdMapping>? rows = null;

            if (changes.Added != null && changes.Added.Count > 0)
            {
                rows = new List<IdMapping>();
                foreach (var newDependency in changes.Added)
                {
                    var phantomId = newDependency.PhantomId;
                    newDependency.Id = 0;

                    _context.Dependencies.Add(newDependency);
                    await _context.SaveChangesAsync();

                    rows.Add(new IdMapping
                    {
                        PhantomId = phantomId,
                        Id = newDependency.Id
                    });
                }
            }

            if (changes.Updated != null && changes.Updated.Count > 0)
            {
                foreach (var dependencyUpdate in changes.Updated)
                {
                    if (dependencyUpdate.Id > 0)
                    {
                        var existingDependency = await _context.Dependencies.FindAsync(dependencyUpdate.Id);
                        if (existingDependency != null)
                        {
                            if (dependencyUpdate.From.HasValue) existingDependency.From = dependencyUpdate.From;
                            if (dependencyUpdate.To.HasValue) existingDependency.To = dependencyUpdate.To;
                            if (dependencyUpdate.FromSide != null) existingDependency.FromSide = dependencyUpdate.FromSide;
                            if (dependencyUpdate.ToSide != null) existingDependency.ToSide = dependencyUpdate.ToSide;
                            if (dependencyUpdate.Cls != null) existingDependency.Cls = dependencyUpdate.Cls;
                            if (dependencyUpdate.Lag.HasValue) existingDependency.Lag = dependencyUpdate.Lag;
                            if (dependencyUpdate.LagUnit != null) existingDependency.LagUnit = dependencyUpdate.LagUnit;

                            await _context.SaveChangesAsync();
                        }
                    }
                }
            }

            if (changes.Removed != null && changes.Removed.Count > 0)
            {
                foreach (var dependencyToRemove in changes.Removed)
                {
                    if (dependencyToRemove.Id > 0)
                    {
                        var existingDependency = await _context.Dependencies.FindAsync(dependencyToRemove.Id);
                        if (existingDependency != null)
                        {
                            _context.Dependencies.Remove(existingDependency);
                            await _context.SaveChangesAsync();
                        }
                    }
                }
            }

            return rows;
        }
    }
}
