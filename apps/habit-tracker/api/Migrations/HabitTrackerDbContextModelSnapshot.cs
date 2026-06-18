using System;
using HabitTracker.Api.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

namespace HabitTracker.Api.Migrations
{
    [DbContext(typeof(HabitTrackerDbContext))]
    public partial class HabitTrackerDbContextModelSnapshot : ModelSnapshot
    {
        protected override void BuildModel(ModelBuilder modelBuilder)
        {
            modelBuilder.HasAnnotation("ProductVersion", "10.0.9");

            modelBuilder.Entity("HabitTracker.Api.Models.AppUser", entity =>
            {
                entity.Property<Guid>("Id").ValueGeneratedOnAdd();
                entity.Property<string>("AvatarUrl");
                entity.Property<DateTimeOffset>("CreatedAt");
                entity.Property<string>("DisplayName").IsRequired();
                entity.Property<string>("Email").IsRequired();
                entity.Property<DateTimeOffset>("LastLoginAt");
                entity.Property<string>("Provider").IsRequired();
                entity.Property<string>("ProviderSubject").IsRequired();

                entity.HasKey("Id");
                entity.HasIndex("Provider", "ProviderSubject").IsUnique();
                entity.ToTable("Users");
            });

            modelBuilder.Entity("HabitTracker.Api.Models.Habit", entity =>
            {
                entity.Property<Guid>("Id").ValueGeneratedOnAdd();
                entity.Property<string>("Color").IsRequired();
                entity.Property<DateTimeOffset>("CreatedAt");
                entity.Property<string>("Frequency").IsRequired();
                entity.Property<string>("Icon").IsRequired();
                entity.Property<string>("Name").IsRequired();
                entity.Property<decimal>("TargetAmount");
                entity.Property<string>("Unit").IsRequired();
                entity.Property<Guid>("UserId");

                entity.HasKey("Id");
                entity.HasIndex("UserId");
                entity.ToTable("Habits");

                entity.HasOne("HabitTracker.Api.Models.AppUser", "User")
                    .WithMany("Habits")
                    .HasForeignKey("UserId")
                    .OnDelete(DeleteBehavior.Cascade)
                    .IsRequired();
            });

            modelBuilder.Entity("HabitTracker.Api.Models.HabitEntry", entity =>
            {
                entity.Property<Guid>("Id").ValueGeneratedOnAdd();
                entity.Property<decimal>("Amount");
                entity.Property<DateTimeOffset>("CreatedAt");
                entity.Property<DateTime>("Date");
                entity.Property<Guid>("HabitId");
                entity.Property<string>("Note");

                entity.HasKey("Id");
                entity.HasIndex("HabitId", "Date");
                entity.ToTable("HabitEntries");

                entity.HasOne("HabitTracker.Api.Models.Habit", "Habit")
                    .WithMany("Entries")
                    .HasForeignKey("HabitId")
                    .OnDelete(DeleteBehavior.Cascade)
                    .IsRequired();
            });
        }
    }
}
