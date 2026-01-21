using System.Text.Json;
using System.Text.Json.Serialization;

namespace SchedulerProApi.Models
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
