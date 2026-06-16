using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using HabitTracker.Api.Data;
using HabitTracker.Api.Models;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authentication.OAuth;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace HabitTracker.Api
{
    public class Startup
    {
        private readonly IConfiguration _configuration;

        public Startup(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public void ConfigureServices(IServiceCollection services)
        {
            services.AddControllers();
            services.AddDbContext<HabitTrackerDbContext>(options =>
                options.UseSqlite(_configuration.GetConnectionString("HabitTracker")));

            services
                .AddAuthentication(options =>
                {
                    options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
                    options.DefaultChallengeScheme = GoogleDefaults.AuthenticationScheme;
                })
                .AddCookie(options =>
                {
                    options.Cookie.Name = "habit_tracker_auth";
                    options.Cookie.HttpOnly = true;
                    options.Cookie.SameSite = Microsoft.AspNetCore.Http.SameSiteMode.Lax;
                    options.LoginPath = "/api/auth/login/google";
                    options.LogoutPath = "/api/auth/logout";
                })
                .AddGoogle(options =>
                {
                    options.ClientId = _configuration["Authentication:Google:ClientId"] ?? "";
                    options.ClientSecret = _configuration["Authentication:Google:ClientSecret"] ?? "";
                    options.CallbackPath = "/signin-google";
                    options.SaveTokens = true;
                    options.Events.OnCreatingTicket = UpsertGoogleUser;
                });

            services.AddCors(options =>
            {
                options.AddPolicy("LocalWeb", builder =>
                    builder
                        .WithOrigins("http://localhost:5173")
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials());
            });
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env, HabitTrackerDbContext db)
        {
            db.Database.EnsureCreated();

            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }

            app.UseRouting();
            app.UseCors("LocalWeb");
            app.UseAuthentication();
            app.UseAuthorization();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
            });
        }

        private static async Task UpsertGoogleUser(OAuthCreatingTicketContext context)
        {
            var db = context.HttpContext.RequestServices.GetRequiredService<HabitTrackerDbContext>();
            var googleId = context.Principal?.FindFirstValue(ClaimTypes.NameIdentifier);
            var email = context.Principal?.FindFirstValue(ClaimTypes.Email);
            var displayName = context.Principal?.FindFirstValue(ClaimTypes.Name);
            var avatarUrl = context.Principal?.FindFirstValue("urn:google:picture");

            if (string.IsNullOrWhiteSpace(googleId) || string.IsNullOrWhiteSpace(email))
            {
                return;
            }

            var user = await db.Users.FirstOrDefaultAsync(candidate =>
                candidate.Provider == "google" && candidate.ProviderSubject == googleId);

            if (user == null)
            {
                user = new AppUser
                {
                    Id = Guid.NewGuid(),
                    Provider = "google",
                    ProviderSubject = googleId,
                    Email = email,
                    DisplayName = displayName ?? email,
                    AvatarUrl = avatarUrl,
                    CreatedAt = DateTimeOffset.UtcNow,
                    LastLoginAt = DateTimeOffset.UtcNow
                };

                db.Users.Add(user);
            }
            else
            {
                user.Email = email;
                user.DisplayName = displayName ?? email;
                user.AvatarUrl = avatarUrl;
                user.LastLoginAt = DateTimeOffset.UtcNow;
            }

            await db.SaveChangesAsync();

            var identity = context.Principal?.Identities.FirstOrDefault();
            identity?.AddClaim(new Claim("app_user_id", user.Id.ToString()));
        }
    }
}
