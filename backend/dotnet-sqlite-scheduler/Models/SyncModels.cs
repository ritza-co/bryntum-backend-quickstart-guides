using System.Text.Json;
using System.Text.Json.Serialization;

namespace SchedulerApi.Models
{
    // Request DTOs
    public class SyncRequest
    {
        [JsonPropertyName("requestId")]
        public long? RequestId { get; set; }

        [JsonPropertyName("events")]
        public StoreChanges<Event>? Events { get; set; }

        [JsonPropertyName("resources")]
        public StoreChanges<Resource>? Resources { get; set; }

        [JsonPropertyName("assignments")]
        public AssignmentStoreChanges? Assignments { get; set; }
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

    // Special store changes for assignments that can have phantom IDs for eventId
    public class AssignmentStoreChanges
    {
        [JsonPropertyName("added")]
        public List<AssignmentSyncDto>? Added { get; set; }

        [JsonPropertyName("updated")]
        public List<AssignmentSyncDto>? Updated { get; set; }

        [JsonPropertyName("removed")]
        public List<AssignmentSyncDto>? Removed { get; set; }
    }

    // DTO for assignment sync that accepts eventId as either int or string
    public class AssignmentSyncDto
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("$PhantomId")]
        public string? PhantomId { get; set; }

        [JsonPropertyName("eventId")]
        public JsonElement? EventIdRaw { get; set; }

        [JsonPropertyName("resourceId")]
        public int ResourceId { get; set; }

        // Convert to Assignment entity, resolving phantom IDs
        public Assignment ToAssignment(Dictionary<string, int>? eventPhantomIdMap)
        {
            var assignment = new Assignment
            {
                Id = Id,
                PhantomId = PhantomId,
                ResourceId = ResourceId
            };

            // Resolve eventId
            if (EventIdRaw.HasValue)
            {
                if (EventIdRaw.Value.ValueKind == JsonValueKind.Number)
                {
                    assignment.EventId = EventIdRaw.Value.GetInt32();
                }
                else if (EventIdRaw.Value.ValueKind == JsonValueKind.String)
                {
                    var phantomId = EventIdRaw.Value.GetString();
                    if (eventPhantomIdMap != null && phantomId != null && eventPhantomIdMap.TryGetValue(phantomId, out int realId))
                    {
                        assignment.EventId = realId;
                    }
                }
            }

            return assignment;
        }
    }

    // Response DTOs
    public class LoadResponse
    {
        [JsonPropertyName("events")]
        public StoreData<Event>? Events { get; set; }

        [JsonPropertyName("resources")]
        public StoreData<Resource>? Resources { get; set; }

        [JsonPropertyName("assignments")]
        public StoreData<Assignment>? Assignments { get; set; }
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

        [JsonPropertyName("assignments")]
        public SyncStoreResponse? Assignments { get; set; }
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
