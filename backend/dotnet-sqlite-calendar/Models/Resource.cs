using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace CalendarApi.Models
{
    [Table("resources")]
    public class Resource
    {
        [Key]
        [Column("id")]
        [JsonPropertyName("id")]
        public string Id { get; set; } = null!;

        [Required]
        [Column("name")]
        [JsonPropertyName("name")]
        public string Name { get; set; } = null!;

        [Column("eventColor")]
        [JsonPropertyName("eventColor")]
        public string? EventColor { get; set; }

        [Column("readOnly")]
        [JsonPropertyName("readOnly")]
        public bool? ReadOnly { get; set; } = false;
    }
}

