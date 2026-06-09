using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Veterinaria.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveCitasUniqueIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Citas_VeterinarioId_FechaHora",
                table: "Citas");

            migrationBuilder.CreateIndex(
                name: "IX_Citas_VeterinarioId_FechaHora",
                table: "Citas",
                columns: new[] { "VeterinarioId", "FechaHora" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Citas_VeterinarioId_FechaHora",
                table: "Citas");

            migrationBuilder.CreateIndex(
                name: "IX_Citas_VeterinarioId_FechaHora",
                table: "Citas",
                columns: new[] { "VeterinarioId", "FechaHora" },
                unique: true);
        }
    }
}
