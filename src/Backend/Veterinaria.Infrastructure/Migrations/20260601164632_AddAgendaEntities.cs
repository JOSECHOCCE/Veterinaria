using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Veterinaria.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAgendaEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "EsUrgencia",
                table: "Citas",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaExpiracionReserva",
                table: "Citas",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "BloqueosAgenda",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    VeterinarioId = table.Column<int>(type: "int", nullable: false),
                    FechaInicio = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaFin = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Motivo = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BloqueosAgenda", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BloqueosAgenda_Veterinarios_VeterinarioId",
                        column: x => x.VeterinarioId,
                        principalTable: "Veterinarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "HorariosClinica",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DiaSemana = table.Column<int>(type: "int", nullable: false),
                    HoraApertura = table.Column<TimeSpan>(type: "time", nullable: false),
                    HoraCierre = table.Column<TimeSpan>(type: "time", nullable: false),
                    EsLaborable = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HorariosClinica", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "HorariosVeterinario",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    VeterinarioId = table.Column<int>(type: "int", nullable: false),
                    DiaSemana = table.Column<int>(type: "int", nullable: false),
                    HoraInicio = table.Column<TimeSpan>(type: "time", nullable: false),
                    HoraFin = table.Column<TimeSpan>(type: "time", nullable: false),
                    EsLaborable = table.Column<bool>(type: "bit", nullable: false),
                    DescansoInicio = table.Column<TimeSpan>(type: "time", nullable: true),
                    DescansoFin = table.Column<TimeSpan>(type: "time", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HorariosVeterinario", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HorariosVeterinario_Veterinarios_VeterinarioId",
                        column: x => x.VeterinarioId,
                        principalTable: "Veterinarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BloqueosAgenda_VeterinarioId_FechaInicio_FechaFin",
                table: "BloqueosAgenda",
                columns: new[] { "VeterinarioId", "FechaInicio", "FechaFin" });

            migrationBuilder.CreateIndex(
                name: "IX_HorariosClinica_DiaSemana",
                table: "HorariosClinica",
                column: "DiaSemana",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_HorariosVeterinario_VeterinarioId_DiaSemana",
                table: "HorariosVeterinario",
                columns: new[] { "VeterinarioId", "DiaSemana" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BloqueosAgenda");

            migrationBuilder.DropTable(
                name: "HorariosClinica");

            migrationBuilder.DropTable(
                name: "HorariosVeterinario");

            migrationBuilder.DropColumn(
                name: "EsUrgencia",
                table: "Citas");

            migrationBuilder.DropColumn(
                name: "FechaExpiracionReserva",
                table: "Citas");
        }
    }
}
