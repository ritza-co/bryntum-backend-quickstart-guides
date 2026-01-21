using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace GanttApi.Models
{
    [Table("dependencies")]
    public class GanttDependency
    {
        [Key]
        [Column("id")]
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("$PhantomId")]
        [NotMapped]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? PhantomId { get; set; }

        [Column("fromEvent")]
        [JsonPropertyName("fromEvent")]
        public int? FromEvent { get; set; }

        [Column("toEvent")]
        [JsonPropertyName("toEvent")]
        public int? ToEvent { get; set; }

        [Column("type")]
        [JsonPropertyName("type")]
        public int? Type { get; set; } = 2;

        [Column("cls")]
        [JsonPropertyName("cls")]
        public string? Cls { get; set; }

        [Column("lag")]
        [JsonPropertyName("lag")]
        public double? Lag { get; set; } = 0;

        [Column("lagUnit")]
        [JsonPropertyName("lagUnit")]
        public string? LagUnit { get; set; } = "day";

        [Column("active")]
        [JsonPropertyName("active")]
        public bool? Active { get; set; } = true;

        [Column("fromSide")]
        [JsonPropertyName("fromSide")]
        public string? FromSide { get; set; }

        [Column("toSide")]
        [JsonPropertyName("toSide")]
        public string? ToSide { get; set; }
    }
}
