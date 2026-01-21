using System.Text.Json;
using System.Text.Json.Serialization;

namespace GanttApi.Models
{
    /// <summary>
    /// Represents an optional JSON property where we need to distinguish:
    /// - property missing (IsSet = false)
    /// - property present with value (IsSet = true, Value = ...)
    /// - property present with explicit null (IsSet = true, Value = null)
    /// </summary>
    [JsonConverter(typeof(OptionalJsonConverterFactory))]
    public readonly struct Optional<T>
    {
        public Optional(T? value, bool isSet)
        {
            Value = value;
            IsSet = isSet;
        }

        public bool IsSet { get; }
        public T? Value { get; }
    }

    public sealed class OptionalJsonConverterFactory : JsonConverterFactory
    {
        public override bool CanConvert(Type typeToConvert)
            => typeToConvert.IsGenericType && typeToConvert.GetGenericTypeDefinition() == typeof(Optional<>);

        public override JsonConverter CreateConverter(Type typeToConvert, JsonSerializerOptions options)
        {
            var innerType = typeToConvert.GetGenericArguments()[0];
            var converterType = typeof(OptionalJsonConverter<>).MakeGenericType(innerType);
            return (JsonConverter)Activator.CreateInstance(converterType)!;
        }

        private sealed class OptionalJsonConverter<T> : JsonConverter<Optional<T>>
        {
            public override Optional<T> Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            {
                if (reader.TokenType == JsonTokenType.Null)
                {
                    return new Optional<T>(default, isSet: true);
                }

                var value = JsonSerializer.Deserialize<T>(ref reader, options);
                return new Optional<T>(value, isSet: true);
            }

            public override void Write(Utf8JsonWriter writer, Optional<T> value, JsonSerializerOptions options)
            {
                JsonSerializer.Serialize(writer, value.Value, options);
            }
        }
    }

    /// <summary>
    /// Patch DTO for task updates. Uses Optional&lt;T&gt; only for ParentId to distinguish
    /// "not sent" from "explicitly null" (needed when promoting a subtask to root).
    /// </summary>
    public class GanttTaskPatch
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("name")]
        public string? Name { get; set; }

        [JsonPropertyName("startDate")]
        public DateTime? StartDate { get; set; }

        [JsonPropertyName("endDate")]
        public DateTime? EndDate { get; set; }

        [JsonPropertyName("duration")]
        public double? Duration { get; set; }

        [JsonPropertyName("percentDone")]
        public double? PercentDone { get; set; }

        [JsonPropertyName("parentId")]
        public Optional<int?> ParentId { get; set; }

        [JsonPropertyName("parentIndex")]
        public int? ParentIndex { get; set; }

        [JsonPropertyName("expanded")]
        public bool? Expanded { get; set; }

        [JsonPropertyName("rollup")]
        public bool? Rollup { get; set; }

        [JsonPropertyName("manuallyScheduled")]
        public bool? ManuallyScheduled { get; set; }

        [JsonPropertyName("effort")]
        public int? Effort { get; set; }
    }

    // Generic store changes for most stores
    public class StoreChanges<T>
    {
        [JsonPropertyName("added")]
        public List<T>? Added { get; set; }

        [JsonPropertyName("updated")]
        public List<T>? Updated { get; set; }

        [JsonPropertyName("removed")]
        public List<T>? Removed { get; set; }
    }

    // Task store needs special handling for updates (GanttTaskPatch with Optional<T> for ParentId)
    public class TaskStoreChanges
    {
        [JsonPropertyName("added")]
        public List<GanttTask>? Added { get; set; }

        [JsonPropertyName("updated")]
        public List<GanttTaskPatch>? Updated { get; set; }

        [JsonPropertyName("removed")]
        public List<GanttTask>? Removed { get; set; }
    }

    // Request DTOs
    public class SyncRequest
    {
        [JsonPropertyName("requestId")]
        public long? RequestId { get; set; }

        [JsonPropertyName("revision")]
        public int? Revision { get; set; }

        [JsonPropertyName("tasks")]
        public TaskStoreChanges? Tasks { get; set; }

        [JsonPropertyName("dependencies")]
        public StoreChanges<GanttDependency>? Dependencies { get; set; }
    }

    // Response DTOs
    public class LoadResponse
    {
        [JsonPropertyName("success")]
        public bool Success { get; set; } = true;

        [JsonPropertyName("requestId")]
        public object? RequestId { get; set; }

        [JsonPropertyName("revision")]
        public int Revision { get; set; } = 1;

        [JsonPropertyName("tasks")]
        public StoreData<GanttTask>? Tasks { get; set; }

        [JsonPropertyName("dependencies")]
        public StoreData<GanttDependency>? Dependencies { get; set; }
    }

    public class StoreData<T>
    {
        [JsonPropertyName("rows")]
        public List<T> Rows { get; set; } = new List<T>();

        [JsonPropertyName("total")]
        public int Total { get; set; }
    }

    public class SyncResponse
    {
        [JsonPropertyName("success")]
        public bool Success { get; set; }

        [JsonPropertyName("requestId")]
        public long? RequestId { get; set; }

        [JsonPropertyName("revision")]
        public int? Revision { get; set; }

        [JsonPropertyName("message")]
        public string? Message { get; set; }

        [JsonPropertyName("tasks")]
        public SyncStoreResponse? Tasks { get; set; }

        [JsonPropertyName("dependencies")]
        public SyncStoreResponse? Dependencies { get; set; }
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
        public int Id { get; set; }
    }
}
