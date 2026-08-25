using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace slurs2.backend.Migrations
{
    /// <inheritdoc />
    public partial class AddLastScannedDateFr : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "LastScannedLogDate",
                table: "Players",
                newName: "LastScannedAt");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "LastScannedAt",
                table: "Players",
                newName: "LastScannedLogDate");
        }
    }
}
