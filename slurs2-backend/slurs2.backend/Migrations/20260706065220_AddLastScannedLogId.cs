using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace slurs2.backend.Migrations
{
    /// <inheritdoc />
    public partial class AddLastScannedLogId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "LastScannedLogId",
                table: "Players",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LastScannedLogId",
                table: "Players");
        }
    }
}
