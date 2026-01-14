using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GanttApi.Data;
using GanttApi.Models;

namespace GanttApi.Controllers
{
    [ApiController]
    [Route("api")]
    public class GanttController : ControllerBase
    {
        private readonly GanttContext _context;
        private readonly ILogger<GanttController> _logger;

        public GanttController(GanttContext context, ILogger<GanttController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet("load")]
        public async Task<ActionResult<LoadResponse>> Load()
        {
            try
            {
                // ParentIndex is a sibling-ordering field (it only makes sense within the same parent),
                // so we order by ParentId first and then ParentIndex.
                var tasks = await _context.Tasks
                    .OrderBy(t => t.ParentId)
                    .ThenBy(t => t.ParentIndex)
                    .ToListAsync();

                var response = new LoadResponse
                {
                    Success = true,
                    RequestId = Request.Headers["x-request-id"].FirstOrDefault() ?? DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString(),
                    Revision = 1,
                    Tasks = new StoreData<GanttTask> 
                    { 
                        Rows = tasks,
                        Total = tasks.Count
                    }
                };

                _logger.LogInformation("Loaded {TaskCount} tasks", tasks.Count);

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading data");
                return StatusCode(500, new { success = false, message = "There was an error loading the tasks data." });
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
                    Revision = (request.Revision ?? 0) + 1,
                    Success = true,
                    Tasks = new SyncStoreResponse { Rows = new List<GanttTask>() }
                };

                if (request.Tasks != null)
                {
                    await ApplyTaskChanges(request.Tasks, response);
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

        private async Task ApplyTaskChanges(TaskStoreChanges changes, SyncResponse response)
        {
            // Handle added tasks - map phantom IDs to real IDs
            if (changes.Added != null && changes.Added.Count > 0)
            {
                foreach (var newTask in changes.Added)
                {
                    var phantomId = newTask.PhantomId;
                    
                    // Reset Id to 0 for new tasks (will be auto-generated)
                    newTask.Id = 0;
                    // Ensure Name is not null (required field)
                    if (newTask.Name == null) newTask.Name = "";

                    _context.Tasks.Add(newTask);
                    await _context.SaveChangesAsync();

                    // Return the created task (includes both $PhantomId and the real id for client mapping)
                    newTask.PhantomId = phantomId;
                    response.Tasks!.Rows!.Add(newTask);
                }
            }

            // Handle updated tasks
            if (changes.Updated != null && changes.Updated.Count > 0)
            {
                foreach (var taskUpdate in changes.Updated)
                {
                    if (taskUpdate.Id > 0)
                    {
                        var existingTask = await _context.Tasks.FindAsync(taskUpdate.Id);
                        if (existingTask != null)
                        {
                            // Update fields if provided (null means not sent for most fields)
                            if (taskUpdate.Name != null) existingTask.Name = taskUpdate.Name;
                            if (taskUpdate.StartDate.HasValue) existingTask.StartDate = taskUpdate.StartDate;
                            if (taskUpdate.EndDate.HasValue) existingTask.EndDate = taskUpdate.EndDate;
                            if (taskUpdate.Duration.HasValue) existingTask.Duration = taskUpdate.Duration;
                            if (taskUpdate.PercentDone.HasValue) existingTask.PercentDone = taskUpdate.PercentDone;
                            // ParentId uses Optional<T> to distinguish "not sent" from "explicitly null"
                            // (needed when promoting a subtask to root level)
                            if (taskUpdate.ParentId.IsSet) existingTask.ParentId = taskUpdate.ParentId.Value;
                            if (taskUpdate.ParentIndex.HasValue) existingTask.ParentIndex = taskUpdate.ParentIndex;
                            if (taskUpdate.Expanded.HasValue) existingTask.Expanded = taskUpdate.Expanded;
                            if (taskUpdate.Rollup.HasValue) existingTask.Rollup = taskUpdate.Rollup;
                            if (taskUpdate.ManuallyScheduled.HasValue) existingTask.ManuallyScheduled = taskUpdate.ManuallyScheduled;
                            if (taskUpdate.Effort.HasValue) existingTask.Effort = taskUpdate.Effort;

                            await _context.SaveChangesAsync();
                        }
                    }
                }
            }

            // Handle removed tasks
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
        }
    }
}
