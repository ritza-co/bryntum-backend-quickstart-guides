using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace GridApi.Models
{
    [Table("players")]
    public class Player
    {
        [Key]
        [Column("id")]
        [JsonPropertyName("id")]
        [JsonConverter(typeof(IntOrStringIdConverter))]
        public int Id { get; set; }

        [Column("name")]
        [JsonPropertyName("name")]
        public string? Name { get; set; }

        [Column("city")]
        [JsonPropertyName("city")]
        public string? City { get; set; }

        [Column("team")]
        [JsonPropertyName("team")]
        public string? Team { get; set; }

        [Column("score")]
        [JsonPropertyName("score")]
        public double Score { get; set; } = 0;

        [Column("percentageWins")]
        [JsonPropertyName("percentageWins")]
        public double PercentageWins { get; set; } = 0;
    }
}
