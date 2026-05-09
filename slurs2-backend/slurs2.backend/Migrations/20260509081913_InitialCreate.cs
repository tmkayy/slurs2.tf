using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace slurs2.backend.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Players",
                columns: table => new
                {
                    SteamId = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    SteamName = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Country = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Players", x => x.SteamId);
                });

            migrationBuilder.CreateTable(
                name: "ProcessedLogs",
                columns: table => new
                {
                    LogId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProcessedLogs", x => x.LogId);
                });

            migrationBuilder.CreateTable(
                name: "SlurInstances",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Message = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    LogId = table.Column<int>(type: "integer", nullable: false),
                    PlayerSteamId = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    SlurCount = table.Column<int>(type: "integer", nullable: false),
                    MessageDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    SlurType = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SlurInstances", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SlurInstances_Players_PlayerSteamId",
                        column: x => x.PlayerSteamId,
                        principalTable: "Players",
                        principalColumn: "SteamId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SlurInstances_ProcessedLogs_LogId",
                        column: x => x.LogId,
                        principalTable: "ProcessedLogs",
                        principalColumn: "LogId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SlurInstances_LogId",
                table: "SlurInstances",
                column: "LogId");

            migrationBuilder.CreateIndex(
                name: "IX_SlurInstances_PlayerSteamId",
                table: "SlurInstances",
                column: "PlayerSteamId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SlurInstances");

            migrationBuilder.DropTable(
                name: "Players");

            migrationBuilder.DropTable(
                name: "ProcessedLogs");
        }
    }
}
