using System;
using System.Collections.Generic;

namespace HabitTracker.Api.Models
{
    public class Habit
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public AppUser? User { get; set; }
        public string Name { get; set; } = "";
        public string Icon { get; set; } = "target";
        public decimal TargetAmount { get; set; }
        public string Unit { get; set; } = "times";
        public string Frequency { get; set; } = "daily";
        public string Color { get; set; } = "#2563eb";
        public DateTimeOffset CreatedAt { get; set; }
        public ICollection<HabitEntry> Entries { get; set; } = new List<HabitEntry>();
    }
}
