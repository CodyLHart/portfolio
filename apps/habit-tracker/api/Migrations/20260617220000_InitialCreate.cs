using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HabitTracker.Api.Migrations
{
    public partial class InitialCreate : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<Guid>(nullable: false),
                    Provider = table.Column<string>(nullable: false),
                    ProviderSubject = table.Column<string>(nullable: false),
                    Email = table.Column<string>(nullable: false),
                    DisplayName = table.Column<string>(nullable: false),
                    AvatarUrl = table.Column<string>(nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(nullable: false),
                    LastLoginAt = table.Column<DateTimeOffset>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Habits",
                columns: table => new
                {
                    Id = table.Column<Guid>(nullable: false),
                    UserId = table.Column<Guid>(nullable: false),
                    Name = table.Column<string>(nullable: false),
                    Icon = table.Column<string>(nullable: false),
                    TargetAmount = table.Column<decimal>(nullable: false),
                    Unit = table.Column<string>(nullable: false),
                    Frequency = table.Column<string>(nullable: false),
                    Color = table.Column<string>(nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Habits", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Habits_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "HabitEntries",
                columns: table => new
                {
                    Id = table.Column<Guid>(nullable: false),
                    HabitId = table.Column<Guid>(nullable: false),
                    Date = table.Column<DateTime>(nullable: false),
                    Amount = table.Column<decimal>(nullable: false),
                    Note = table.Column<string>(nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HabitEntries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HabitEntries_Habits_HabitId",
                        column: x => x.HabitId,
                        principalTable: "Habits",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_HabitEntries_HabitId_Date",
                table: "HabitEntries",
                columns: new[] { "HabitId", "Date" });

            migrationBuilder.CreateIndex(
                name: "IX_Habits_UserId",
                table: "Habits",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Provider_ProviderSubject",
                table: "Users",
                columns: new[] { "Provider", "ProviderSubject" },
                unique: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "HabitEntries");
            migrationBuilder.DropTable(name: "Habits");
            migrationBuilder.DropTable(name: "Users");
        }
    }
}
