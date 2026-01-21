using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace TaskBoardApi.Models
{
    [Table("tasks")]
    public class TaskItem
    {
        [Key]
        [Column("id")]
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("$PhantomId")]
        [NotMapped]
        public string? PhantomId { get; set; }

        [Column("name")]
        [JsonPropertyName("name")]
        public string? Name { get; set; }

        [Column("eventColor")]
        [JsonPropertyName("eventColor")]
        public string? EventColor { get; set; }

        [Column("description")]
        [JsonPropertyName("description")]
        public string? Description { get; set; }

        [Column("weight")]
        [JsonPropertyName("weight")]
        public int Weight { get; set; } = 1;

        [Column("status")]
        [JsonPropertyName("status")]
        public string? Status { get; set; }

        [Column("prio")]
        [JsonPropertyName("prio")]
        public string? Prio { get; set; }
    }
}
