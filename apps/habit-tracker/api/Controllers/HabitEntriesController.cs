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
    public class TrackHabitRequest
    {
        public Guid HabitId { get; set; }
        public DateTime Date { get; set; }
        public decimal Amount { get; set; }
        public string? Note { get; set; }
    }

    public class HabitEntryResponse
    {
        public Guid Id { get; set; }
        public Guid HabitId { get; set; }
        public DateTime Date { get; set; }
        public decimal Amount { get; set; }
        public string? Note { get; set; }
    }

    [Authorize]
    [ApiController]
    [Route("api/habit-entries")]
    public class HabitEntriesController : ControllerBase
    {
        private readonly HabitTrackerDbContext _db;

        public HabitEntriesController(HabitTrackerDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> List([FromQuery] DateTime from, [FromQuery] DateTime to)
        {
            var userId = User.GetAppUserId();
            var entries = await _db.HabitEntries
                .Include(entry => entry.Habit)
                .Where(entry =>
                    entry.Habit != null &&
                    entry.Habit.UserId == userId &&
                    entry.Date >= from.Date &&
                    entry.Date <= to.Date)
                .OrderByDescending(entry => entry.Date)
                .Select(entry => new HabitEntryResponse
                {
                    Id = entry.Id,
                    HabitId = entry.HabitId,
                    Date = entry.Date,
                    Amount = entry.Amount,
                    Note = entry.Note
                })
                .ToListAsync();

            return Ok(entries);
        }

        [HttpPost]
        public async Task<IActionResult> Track(TrackHabitRequest request)
        {
            var userId = User.GetAppUserId();
            var habitExists = await _db.Habits.AnyAsync(habit =>
                habit.Id == request.HabitId && habit.UserId == userId);

            if (!habitExists)
            {
                return NotFound();
            }

            var entry = new HabitEntry
            {
                Id = Guid.NewGuid(),
                HabitId = request.HabitId,
                Date = request.Date == default ? DateTime.UtcNow.Date : request.Date.Date,
                Amount = request.Amount <= 0 ? 1 : request.Amount,
                Note = request.Note,
                CreatedAt = DateTimeOffset.UtcNow
            };

            _db.HabitEntries.Add(entry);
            await _db.SaveChangesAsync();

            return Ok(new HabitEntryResponse
            {
                Id = entry.Id,
                HabitId = entry.HabitId,
                Date = entry.Date,
                Amount = entry.Amount,
                Note = entry.Note
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var userId = User.GetAppUserId();
            var entry = await _db.HabitEntries
                .Include(candidate => candidate.Habit)
                .FirstOrDefaultAsync(candidate =>
                    candidate.Id == id &&
                    candidate.Habit != null &&
                    candidate.Habit.UserId == userId);

            if (entry == null)
            {
                return NotFound();
            }

            _db.HabitEntries.Remove(entry);
            await _db.SaveChangesAsync();

            return NoContent();
        }
    }
}
