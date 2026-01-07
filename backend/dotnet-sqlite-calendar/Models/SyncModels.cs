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

