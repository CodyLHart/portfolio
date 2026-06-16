using System;

namespace HabitTracker.Api.Models
{
    public class HabitEntry
    {
        public Guid Id { get; set; }
        public Guid HabitId { get; set; }
        public Habit? Habit { get; set; }
        public DateTime Date { get; set; }
        public decimal Amount { get; set; }
        public string? Note { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
    }
}
