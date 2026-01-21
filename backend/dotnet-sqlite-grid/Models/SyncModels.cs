using System.Text.Json.Serialization;

namespace GridApi.Models
{
    // Response DTOs for Grid - uses AjaxStore pattern (not CrudManager)
    public class ReadResponse
    {
        [JsonPropertyName("success")]
        public bool Success { get; set; }

        [JsonPropertyName("data")]
        public List<Player>? Data { get; set; }

        [JsonPropertyName("message")]
        public string? Message { get; set; }
    }

    public class CreateUpdateRequest
    {
        [JsonPropertyName("data")]
        public List<Player>? Data { get; set; }
    }

    public class DeleteRequest
    {
        [JsonPropertyName("ids")]
        public List<int>? Ids { get; set; }
    }

    public class DeleteResponse
    {
        [JsonPropertyName("success")]
        public bool Success { get; set; }

        [JsonPropertyName("message")]
        public string? Message { get; set; }
    }
}
