using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace slurs2.backend.Migrations
{
    /// <inheritdoc />
    public partial class AddLastScannedDate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "LastScannedLogDate",
                table: "Players",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LastScannedLogDate",
                table: "Players");
        }
    }
}
