using System.Linq;
using System.Threading.Tasks;
using HabitTracker.Api.Data;
using HabitTracker.Api.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HabitTracker.Api.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly HabitTrackerDbContext _db;

        public AuthController(HabitTrackerDbContext db)
        {
            _db = db;
        }

        [HttpGet("login/google")]
        public IActionResult LoginWithGoogle([FromQuery] string? returnUrl = "http://localhost:5173")
        {
            return Challenge(
                new AuthenticationProperties { RedirectUri = returnUrl ?? "http://localhost:5173" },
                GoogleDefaults.AuthenticationScheme);
        }

        [HttpGet("me")]
        public async Task<IActionResult> Me()
        {
            if (User?.Identity?.IsAuthenticated != true)
            {
                return Ok(null);
            }

            var userId = User.GetAppUserId();
            var user = await _db.Users
                .Where(candidate => candidate.Id == userId)
                .Select(candidate => new
                {
                    candidate.Id,
                    candidate.DisplayName,
                    candidate.Email,
                    candidate.AvatarUrl
                })
                .FirstOrDefaultAsync();

            return Ok(user);
        }

        [Authorize]
        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            await HttpContext.SignOutAsync();
            return NoContent();
        }

        [Authorize]
        [HttpGet("users")]
        public async Task<IActionResult> Users()
        {
            var users = await _db.Users
                .OrderByDescending(user => user.LastLoginAt)
                .Select(user => new
                {
                    user.Id,
                    user.DisplayName,
                    user.Email,
                    user.AvatarUrl,
                    user.CreatedAt,
                    user.LastLoginAt
                })
                .ToListAsync();

            return Ok(users);
        }
    }
}
