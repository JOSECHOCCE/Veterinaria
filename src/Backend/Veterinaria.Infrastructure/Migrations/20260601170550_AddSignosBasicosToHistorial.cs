using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Veterinaria.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSignosBasicosToHistorial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "Cerrado",
                table: "HistorialesClinicos",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "FrecuenciaCardiaca",
                table: "HistorialesClinicos",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "PesoActual",
                table: "HistorialesClinicos",
                type: "decimal(5,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Temperatura",
                table: "HistorialesClinicos",
                type: "decimal(5,2)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Cerrado",
                table: "HistorialesClinicos");

            migrationBuilder.DropColumn(
                name: "FrecuenciaCardiaca",
                table: "HistorialesClinicos");

            migrationBuilder.DropColumn(
                name: "PesoActual",
                table: "HistorialesClinicos");

            migrationBuilder.DropColumn(
                name: "Temperatura",
                table: "HistorialesClinicos");
        }
    }
}
