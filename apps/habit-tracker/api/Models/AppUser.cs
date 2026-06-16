using System;
using System.Collections.Generic;

namespace HabitTracker.Api.Models
{
    public class AppUser
    {
        public Guid Id { get; set; }
        public string Provider { get; set; } = "";
        public string ProviderSubject { get; set; } = "";
        public string Email { get; set; } = "";
        public string DisplayName { get; set; } = "";
        public string? AvatarUrl { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
        public DateTimeOffset LastLoginAt { get; set; }
        public ICollection<Habit> Habits { get; set; } = new List<Habit>();
    }
}
