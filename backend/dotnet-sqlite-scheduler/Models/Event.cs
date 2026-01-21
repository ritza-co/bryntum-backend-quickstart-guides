using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace SchedulerApi.Models
{
    [Table("events")]
    public class Event
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

        [Column("startDate")]
        [JsonPropertyName("startDate")]
        public DateTime? StartDate { get; set; }

        [Column("endDate")]
        [JsonPropertyName("endDate")]
        public DateTime? EndDate { get; set; }

        [Column("allDay")]
        [JsonPropertyName("allDay")]
        public bool? AllDay { get; set; } = false;

        [Column("duration")]
        [JsonPropertyName("duration")]
        public double? Duration { get; set; }

        [Column("durationUnit")]
        [JsonPropertyName("durationUnit")]
        public string? DurationUnit { get; set; } = "day";

        [Column("readOnly")]
        [JsonPropertyName("readOnly")]
        public bool? ReadOnly { get; set; } = false;

        [Column("draggable")]
        [JsonPropertyName("draggable")]
        public bool? Draggable { get; set; } = true;

        [Column("resizable")]
        [JsonPropertyName("resizable")]
        public string? Resizable { get; set; } = "true";

        [Column("timeZone")]
        [JsonPropertyName("timeZone")]
        public string? TimeZone { get; set; }

        [Column("recurrenceRule")]
        [JsonPropertyName("recurrenceRule")]
        public string? RecurrenceRule { get; set; }

        [Column("exceptionDates")]
        [JsonPropertyName("exceptionDates")]
        [JsonConverter(typeof(JsonStringToArrayConverter))]
        public string? ExceptionDates { get; set; }

        [Column("children")]
        [JsonPropertyName("children")]
        public string? Children { get; set; }

        [Column("cls")]
        [JsonPropertyName("cls")]
        public string? Cls { get; set; }

        [Column("eventColor")]
        [JsonPropertyName("eventColor")]
        public string? EventColor { get; set; }

        [Column("eventStyle")]
        [JsonPropertyName("eventStyle")]
        public string? EventStyle { get; set; }

        [Column("iconCls")]
        [JsonPropertyName("iconCls")]
        public string? IconCls { get; set; }

        [Column("style")]
        [JsonPropertyName("style")]
        public string? Style { get; set; }
    }
}
