using System;
using System.Linq;
using System.Threading.Tasks;
using HabitTracker.Api.Data;
using HabitTracker.Api.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace HabitTracker.Api.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly HabitTrackerDbContext _db;
        private readonly IConfiguration _configuration;

        public AuthController(HabitTrackerDbContext db, IConfiguration configuration)
        {
            _db = db;
            _configuration = configuration;
        }

        [HttpGet("login/google")]
        public IActionResult LoginWithGoogle([FromQuery] string? returnUrl = null)
        {
            return Challenge(
                new AuthenticationProperties { RedirectUri = GetAllowedReturnUrl(returnUrl) },
                GoogleDefaults.AuthenticationScheme);
        }

        [HttpGet("me")]
        public async Task<IActionResult> Me()
        {
            if (User?.Identity?.IsAuthenticated != true)
            {
                return Ok(null);
            }

            if (!User.TryGetAppUserId(out var userId))
            {
                await HttpContext.SignOutAsync();
                return Ok(null);
            }

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

            if (user == null)
            {
                await HttpContext.SignOutAsync();
            }

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

            return Ok(users.OrderByDescending(user => user.LastLoginAt));
        }

        private string GetAllowedReturnUrl(string? returnUrl)
        {
            var fallbackUrl = _configuration["Client:WebUrl"] ?? "http://127.0.0.1:5173";
            var allowedOrigins = _configuration
                .GetSection("Client:AllowedOrigins")
                .Get<string[]>() ?? new[] { fallbackUrl };

            if (
                string.IsNullOrWhiteSpace(returnUrl) ||
                !Uri.TryCreate(returnUrl, UriKind.Absolute, out var requestedUri)
            )
            {
                return fallbackUrl;
            }

            var requestedOrigin = requestedUri.GetLeftPart(UriPartial.Authority);

            return allowedOrigins.Any(origin =>
                string.Equals(origin, requestedOrigin, System.StringComparison.OrdinalIgnoreCase))
                    ? returnUrl
                    : fallbackUrl;
        }
    }
}
