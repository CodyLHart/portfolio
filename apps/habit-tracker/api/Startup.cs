using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using HabitTracker.Api.Data;
using HabitTracker.Api.Models;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authentication.OAuth;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace HabitTracker.Api
{
    public class Startup
    {
        private readonly IConfiguration _configuration;
        private readonly IWebHostEnvironment _environment;

        public Startup(IConfiguration configuration, IWebHostEnvironment environment)
        {
            _configuration = configuration;
            _environment = environment;
        }

        public void ConfigureServices(IServiceCollection services)
        {
            services.AddControllers();
            services.AddDbContext<HabitTrackerDbContext>(ConfigureDatabase);

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
                    options.Cookie.SameSite = _environment.IsDevelopment()
                        ? Microsoft.AspNetCore.Http.SameSiteMode.Lax
                        : Microsoft.AspNetCore.Http.SameSiteMode.None;
                    options.Cookie.SecurePolicy = _environment.IsDevelopment()
                        ? Microsoft.AspNetCore.Http.CookieSecurePolicy.SameAsRequest
                        : Microsoft.AspNetCore.Http.CookieSecurePolicy.Always;
                    options.LoginPath = "/api/auth/login/google";
                    options.LogoutPath = "/api/auth/logout";
                })
                .AddGoogle(options =>
                {
                    options.ClientId = _configuration["Authentication:Google:ClientId"] ?? "";
                    options.ClientSecret = _configuration["Authentication:Google:ClientSecret"] ?? "";
                    options.CallbackPath = "/signin-google";
                    options.SaveTokens = true;
                    options.ClaimActions.MapJsonKey("urn:google:picture", "picture", "url");
                    options.Events.OnCreatingTicket = UpsertGoogleUser;
                });

            services.AddCors(options =>
            {
                var allowedOrigins = _configuration
                    .GetSection("Client:AllowedOrigins")
                    .Get<string[]>() ?? new[]
                    {
                        "http://127.0.0.1:5173",
                        "http://localhost:5173"
                    };

                options.AddPolicy("LocalWeb", builder =>
                    builder
                        .WithOrigins(allowedOrigins)
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials());
            });
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env, HabitTrackerDbContext db)
        {
            if (ShouldRunMigrationsOnStartup())
            {
                db.Database.Migrate();
            }
            else if (!IsPostgresProvider())
            {
                db.Database.EnsureCreated();
            }

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
                endpoints.MapGet("/health", async context =>
                {
                    context.Response.ContentType = "text/plain";
                    await context.Response.WriteAsync("ok");
                });
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

        private void ConfigureDatabase(DbContextOptionsBuilder options)
        {
            var connectionString = _configuration.GetConnectionString("HabitTracker");

            if (IsPostgresProvider())
            {
                options.UseNpgsql(connectionString);
                return;
            }

            options.UseSqlite(connectionString);
        }

        private bool IsPostgresProvider()
        {
            var provider = _configuration["Database:Provider"];

            return string.Equals(provider, "Postgres", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(provider, "PostgreSQL", StringComparison.OrdinalIgnoreCase);
        }

        private bool ShouldRunMigrationsOnStartup()
        {
            return IsPostgresProvider() &&
                bool.TryParse(_configuration["Database:RunMigrationsOnStartup"], out var runMigrations) &&
                runMigrations;
        }
    }
}
