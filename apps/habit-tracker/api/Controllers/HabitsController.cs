using System;
using System.Linq;
using System.Threading.Tasks;
using HabitTracker.Api.Data;
using HabitTracker.Api.Models;
using HabitTracker.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HabitTracker.Api.Controllers
{
    public class CreateHabitRequest
    {
        public string Name { get; set; } = "";
        public string Icon { get; set; } = "target";
        public decimal TargetAmount { get; set; }
        public string Unit { get; set; } = "times";
        public string Frequency { get; set; } = "daily";
        public string Color { get; set; } = "#2563eb";
    }

    [Authorize]
    [ApiController]
    [Route("api/habits")]
    public class HabitsController : ControllerBase
    {
        private readonly HabitTrackerDbContext _db;

        public HabitsController(HabitTrackerDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> List()
        {
            var userId = User.GetAppUserId();
            var habits = await _db.Habits
                .Where(habit => habit.UserId == userId)
                .OrderByDescending(habit => habit.CreatedAt)
                .ToListAsync();

            return Ok(habits);
        }

        [HttpPost]
        public async Task<IActionResult> Create(CreateHabitRequest request)
        {
            var userId = User.GetAppUserId();
            var habit = new Habit
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Name = request.Name.Trim(),
                Icon = string.IsNullOrWhiteSpace(request.Icon) ? "target" : request.Icon,
                TargetAmount = request.TargetAmount <= 0 ? 1 : request.TargetAmount,
                Unit = string.IsNullOrWhiteSpace(request.Unit) ? "times" : request.Unit.Trim(),
                Frequency = string.IsNullOrWhiteSpace(request.Frequency) ? "daily" : request.Frequency.Trim(),
                Color = string.IsNullOrWhiteSpace(request.Color) ? "#2563eb" : request.Color.Trim(),
                CreatedAt = DateTimeOffset.UtcNow
            };

            _db.Habits.Add(habit);
            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(List), new { id = habit.Id }, habit);
        }
    }
}
