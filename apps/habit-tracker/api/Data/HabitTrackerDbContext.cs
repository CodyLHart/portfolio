using HabitTracker.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HabitTracker.Api.Data
{
    public class HabitTrackerDbContext : DbContext
    {
        public HabitTrackerDbContext(DbContextOptions<HabitTrackerDbContext> options)
            : base(options)
        {
        }

        public DbSet<AppUser> Users => Set<AppUser>();
        public DbSet<Habit> Habits => Set<Habit>();
        public DbSet<HabitEntry> HabitEntries => Set<HabitEntry>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<AppUser>()
                .HasIndex(user => new { user.Provider, user.ProviderSubject })
                .IsUnique();

            modelBuilder.Entity<Habit>()
                .HasOne(habit => habit.User)
                .WithMany(user => user!.Habits)
                .HasForeignKey(habit => habit.UserId);

            modelBuilder.Entity<HabitEntry>()
                .HasOne(entry => entry.Habit)
                .WithMany(habit => habit!.Entries)
                .HasForeignKey(entry => entry.HabitId);

            modelBuilder.Entity<HabitEntry>()
                .HasIndex(entry => new { entry.HabitId, entry.Date });
        }
    }
}
