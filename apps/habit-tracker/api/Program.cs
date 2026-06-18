using System;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;

namespace HabitTracker.Api
{
    public class Program
    {
        public static void Main(string[] args)
        {
            CreateHostBuilder(args).Build().Run();
        }

        public static IHostBuilder CreateHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
                .ConfigureWebHostDefaults(webBuilder =>
                {
                    webBuilder.UseStartup<Startup>();
                    var port = Environment.GetEnvironmentVariable("PORT");
                    var urls = Environment.GetEnvironmentVariable("ASPNETCORE_URLS") ??
                        (string.IsNullOrWhiteSpace(port)
                            ? "http://127.0.0.1:5087"
                            : $"http://0.0.0.0:{port}");

                    webBuilder.UseUrls(urls);
                });
    }
}
