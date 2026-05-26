using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Veterinaria.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTriageAndConsentimiento : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Consentimientos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    MascotaId = table.Column<int>(type: "int", nullable: true),
                    TipoConsentimiento = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    NombrePropietario = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    NombrePaciente = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    DocumentoId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Aceptado = table.Column<bool>(type: "bit", nullable: false),
                    FechaAceptacion = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IpOrigen = table.Column<string>(type: "nvarchar(45)", maxLength: 45, nullable: true),
                    Observaciones = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    FirmaDigital = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FechaCreacion = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Consentimientos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Consentimientos_Mascotas_MascotaId",
                        column: x => x.MascotaId,
                        principalTable: "Mascotas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Consentimientos_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Triages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CitaId = table.Column<int>(type: "int", nullable: true),
                    MascotaId = table.Column<int>(type: "int", nullable: false),
                    Nivel = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Sintomas = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    MotivoConsulta = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Temperatura = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: true),
                    FrecuenciaCardiaca = table.Column<int>(type: "int", nullable: true),
                    PesoEstimado = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: true),
                    PrioridadColor = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    TiempoEsperaEstimadoMin = table.Column<int>(type: "int", nullable: false),
                    Consultorio = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Estado = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    FechaRegistro = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Triages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Triages_Citas_CitaId",
                        column: x => x.CitaId,
                        principalTable: "Citas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Triages_Mascotas_MascotaId",
                        column: x => x.MascotaId,
                        principalTable: "Mascotas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Consentimientos_FechaCreacion",
                table: "Consentimientos",
                column: "FechaCreacion");

            migrationBuilder.CreateIndex(
                name: "IX_Consentimientos_MascotaId",
                table: "Consentimientos",
                column: "MascotaId");

            migrationBuilder.CreateIndex(
                name: "IX_Consentimientos_UsuarioId",
                table: "Consentimientos",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_Triages_CitaId",
                table: "Triages",
                column: "CitaId");

            migrationBuilder.CreateIndex(
                name: "IX_Triages_Estado",
                table: "Triages",
                column: "Estado");

            migrationBuilder.CreateIndex(
                name: "IX_Triages_FechaRegistro",
                table: "Triages",
                column: "FechaRegistro");

            migrationBuilder.CreateIndex(
                name: "IX_Triages_MascotaId",
                table: "Triages",
                column: "MascotaId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Consentimientos");

            migrationBuilder.DropTable(
                name: "Triages");
        }
    }
}
