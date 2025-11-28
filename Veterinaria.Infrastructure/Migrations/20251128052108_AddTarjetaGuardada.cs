using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Veterinaria.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTarjetaGuardada : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TarjetasGuardadas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    NombreTitular = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    NumeroTarjetaEncriptado = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    UltimosDigitos = table.Column<string>(type: "nvarchar(4)", maxLength: 4, nullable: false),
                    FechaExpiracion = table.Column<string>(type: "nvarchar(5)", maxLength: 5, nullable: false),
                    CVVEncriptado = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    FechaRegistro = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Activa = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TarjetasGuardadas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TarjetasGuardadas_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TarjetasGuardadas_UsuarioId",
                table: "TarjetasGuardadas",
                column: "UsuarioId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TarjetasGuardadas");
        }
    }
}
