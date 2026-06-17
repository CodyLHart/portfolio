using System;
using System.Security.Claims;

namespace HabitTracker.Api.Services
{
    public static class UserClaims
    {
        public static bool TryGetAppUserId(this ClaimsPrincipal user, out Guid id)
        {
            var value = user.FindFirstValue("app_user_id");
            return Guid.TryParse(value, out id);
        }

        public static Guid GetAppUserId(this ClaimsPrincipal user)
        {
            if (user.TryGetAppUserId(out var id))
            {
                return id;
            }

            throw new InvalidOperationException("Authenticated user is missing app_user_id.");
        }
    }
}
