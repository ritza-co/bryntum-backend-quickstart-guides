using System.Text.Json;
using System.Text.Json.Serialization;

namespace GridApi.Models
{
    /// <summary>
    /// Converts an ID that can be either an integer or a string (phantom ID).
    /// When reading a string, it returns 0 (for auto-generation).
    /// When writing, it always writes the integer value.
    /// </summary>
    public class IntOrStringIdConverter : JsonConverter<int>
    {
        public override int Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.Number)
            {
                return reader.GetInt32();
            }
            else if (reader.TokenType == JsonTokenType.String)
            {
                var stringValue = reader.GetString();
                // If it's a valid integer string, parse it
                if (int.TryParse(stringValue, out int intValue))
                {
                    return intValue;
                }
                // Otherwise it's a phantom ID - return 0 for auto-generation
                return 0;
            }
            else if (reader.TokenType == JsonTokenType.Null)
            {
                return 0;
            }

            throw new JsonException($"Unable to convert to int. Token type: {reader.TokenType}");
        }

        public override void Write(Utf8JsonWriter writer, int value, JsonSerializerOptions options)
        {
            writer.WriteNumberValue(value);
        }
    }
}
