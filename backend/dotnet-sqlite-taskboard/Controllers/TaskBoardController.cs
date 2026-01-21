using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskBoardApi.Data;
using TaskBoardApi.Models;

namespace TaskBoardApi.Controllers
{
    [ApiController]
    [Route("api")]
    public class TaskBoardController : ControllerBase
    {
        private readonly TaskBoardContext _context;
        private readonly ILogger<TaskBoardController> _logger;

        public TaskBoardController(TaskBoardContext context, ILogger<TaskBoardController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet("load")]
        public async Task<ActionResult<LoadResponse>> Load()
        {
            try
            {
                var tasksTask = _context.Tasks.ToListAsync();
                var resourcesTask = _context.Resources.ToListAsync();
                var assignmentsTask = _context.Assignments.ToListAsync();

                await Task.WhenAll(tasksTask, resourcesTask, assignmentsTask);

                var response = new LoadResponse
                {
                    Tasks = new StoreData<TaskItem> { Rows = tasksTask.Result },
                    Resources = new StoreData<Resource> { Rows = resourcesTask.Result },
                    Assignments = new StoreData<Assignment> { Rows = assignmentsTask.Result }
                };

                _logger.LogInformation("Loaded {TaskCount} tasks, {ResourceCount} resources, {AssignmentCount} assignments",
                    tasksTask.Result.Count, resourcesTask.Result.Count, assignmentsTask.Result.Count);

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading data");
                return StatusCode(500, new { success = false, message = "There was an error loading the assignments, tasks, and resources data." });
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

                // Track task phantom ID mappings for assignments
                var taskPhantomIdMap = new Dictionary<string, int>();

                // Process resources first
                if (request.Resources != null)
                {
                    var rows = await ApplyResourceChanges(request.Resources);
                    if (rows != null && rows.Count > 0)
                    {
                        response.Resources = new SyncStoreResponse { Rows = rows };
                    }
                }

                // Process tasks second (track phantom IDs)
                if (request.Tasks != null)
                {
                    var rows = await ApplyTaskChanges(request.Tasks, taskPhantomIdMap);
                    if (rows != null && rows.Count > 0)
                    {
                        response.Tasks = new SyncStoreResponse { Rows = rows };
                    }
                }

                // Process assignments last (use task phantom ID mappings)
                if (request.Assignments != null)
                {
                    var rows = await ApplyAssignmentChanges(request.Assignments, taskPhantomIdMap);
                    if (rows != null && rows.Count > 0)
                    {
                        response.Assignments = new SyncStoreResponse { Rows = rows };
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

        private async Task<List<IdMapping>?> ApplyTaskChanges(StoreChanges<TaskItem> changes, Dictionary<string, int> phantomIdMap)
        {
            List<IdMapping>? rows = null;

            if (changes.Added != null && changes.Added.Count > 0)
            {
                rows = new List<IdMapping>();
                foreach (var newTask in changes.Added)
                {
                    var phantomId = newTask.PhantomId;
                    newTask.Id = 0;
                    if (newTask.Name == null) newTask.Name = "";

                    _context.Tasks.Add(newTask);
                    await _context.SaveChangesAsync();

                    if (!string.IsNullOrEmpty(phantomId))
                    {
                        phantomIdMap[phantomId] = newTask.Id;
                    }

                    rows.Add(new IdMapping
                    {
                        PhantomId = phantomId,
                        Id = newTask.Id
                    });
                }
            }

            if (changes.Updated != null && changes.Updated.Count > 0)
            {
                foreach (var taskUpdate in changes.Updated)
                {
                    if (taskUpdate.Id > 0)
                    {
                        var existingTask = await _context.Tasks.FindAsync(taskUpdate.Id);
                        if (existingTask != null)
                        {
                            if (taskUpdate.Name != null) existingTask.Name = taskUpdate.Name;
                            if (taskUpdate.EventColor != null) existingTask.EventColor = taskUpdate.EventColor;
                            if (taskUpdate.Description != null) existingTask.Description = taskUpdate.Description;
                            existingTask.Weight = taskUpdate.Weight;
                            if (taskUpdate.Status != null) existingTask.Status = taskUpdate.Status;
                            if (taskUpdate.Prio != null) existingTask.Prio = taskUpdate.Prio;

                            await _context.SaveChangesAsync();
                        }
                    }
                }
            }

            if (changes.Removed != null && changes.Removed.Count > 0)
            {
                foreach (var taskToRemove in changes.Removed)
                {
                    if (taskToRemove.Id > 0)
                    {
                        var existingTask = await _context.Tasks.FindAsync(taskToRemove.Id);
                        if (existingTask != null)
                        {
                            _context.Tasks.Remove(existingTask);
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

        private async Task<List<IdMapping>?> ApplyAssignmentChanges(AssignmentStoreChanges changes, Dictionary<string, int> taskPhantomIdMap)
        {
            List<IdMapping>? rows = null;

            if (changes.Added != null && changes.Added.Count > 0)
            {
                rows = new List<IdMapping>();
                foreach (var dto in changes.Added)
                {
                    var phantomId = dto.PhantomId;
                    var newAssignment = dto.ToAssignment(taskPhantomIdMap);
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
                    var assignmentUpdate = dto.ToAssignment(taskPhantomIdMap);

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
    }
}
