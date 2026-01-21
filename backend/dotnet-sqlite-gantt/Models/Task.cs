using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace GanttApi.Models
{
  [Table("tasks")]
  public class GanttTask
  {
    [Key]
    [Column("id")]
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("$PhantomId")]
    [NotMapped]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? PhantomId { get; set; }

    [Column("name")]
    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [Column("startDate")]
    [JsonPropertyName("startDate")]
    public DateTime? StartDate { get; set; }

    [Column("endDate")]
    [JsonPropertyName("endDate")]
    public DateTime? EndDate { get; set; }

    [Column("duration")]
    [JsonPropertyName("duration")]
    public double? Duration { get; set; }

    [Column("percentDone")]
    [JsonPropertyName("percentDone")]
    public double? PercentDone { get; set; } = 0;

    [Column("parentId")]
    [JsonPropertyName("parentId")]
    public int? ParentId { get; set; }

    [Column("expanded")]
    [JsonPropertyName("expanded")]
    public bool? Expanded { get; set; } = true;

    [Column("rollup")]
    [JsonPropertyName("rollup")]
    public bool? Rollup { get; set; } = false;

    [Column("manuallyScheduled")]
    [JsonPropertyName("manuallyScheduled")]
    public bool? ManuallyScheduled { get; set; } = false;

    [Column("parentIndex")]
    [JsonPropertyName("parentIndex")]
    public int? ParentIndex { get; set; }

    [Column("effort")]
    [JsonPropertyName("effort")]
    public int? Effort { get; set; }        
    }
}
