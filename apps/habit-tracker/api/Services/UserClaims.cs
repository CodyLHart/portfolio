using System;
using System.Security.Claims;

namespace HabitTracker.Api.Services
{
    public static class UserClaims
    {
        public static Guid GetAppUserId(this ClaimsPrincipal user)
        {
            var value = user.FindFirstValue("app_user_id");

            if (Guid.TryParse(value, out var id))
            {
                return id;
            }

            throw new InvalidOperationException("Authenticated user is missing app_user_id.");
        }
    }
}
