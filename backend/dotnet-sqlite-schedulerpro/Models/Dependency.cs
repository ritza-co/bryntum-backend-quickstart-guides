using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace SchedulerProApi.Models
{
    [Table("dependencies")]
    public class Dependency
    {
        [Key]
        [Column("id")]
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("$PhantomId")]
        [NotMapped]
        public string? PhantomId { get; set; }

        [Column("from")]
        [JsonPropertyName("from")]
        public int? From { get; set; }

        [Column("to")]
        [JsonPropertyName("to")]
        public int? To { get; set; }

        [Column("fromSide")]
        [JsonPropertyName("fromSide")]
        public string? FromSide { get; set; } = "right";

        [Column("toSide")]
        [JsonPropertyName("toSide")]
        public string? ToSide { get; set; } = "left";

        [Column("cls")]
        [JsonPropertyName("cls")]
        public string? Cls { get; set; }

        [Column("lag")]
        [JsonPropertyName("lag")]
        public double? Lag { get; set; } = 0;

        [Column("lagUnit")]
        [JsonPropertyName("lagUnit")]
        public string? LagUnit { get; set; } = "day";
    }
}
