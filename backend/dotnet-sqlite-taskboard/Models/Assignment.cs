using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace TaskBoardApi.Models
{
    [Table("assignments")]
    public class Assignment
    {
        [Key]
        [Column("id")]
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("$PhantomId")]
        [NotMapped]
        public string? PhantomId { get; set; }

        [Column("eventId")]
        [JsonPropertyName("eventId")]
        public int EventId { get; set; }

        [Column("resourceId")]
        [JsonPropertyName("resourceId")]
        public int ResourceId { get; set; }
    }
}
