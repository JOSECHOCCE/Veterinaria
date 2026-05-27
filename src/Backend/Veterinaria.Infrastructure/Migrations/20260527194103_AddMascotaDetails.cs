using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Veterinaria.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMascotaDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AlergiasConocidas",
                table: "Mascotas",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ObservacionesGenerales",
                table: "Mascotas",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Sexo",
                table: "Mascotas",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Hallazgos",
                table: "HistorialesClinicos",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MotivoConsulta",
                table: "HistorialesClinicos",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ProximoControl",
                table: "HistorialesClinicos",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Recomendaciones",
                table: "HistorialesClinicos",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AlergiasConocidas",
                table: "Mascotas");

            migrationBuilder.DropColumn(
                name: "ObservacionesGenerales",
                table: "Mascotas");

            migrationBuilder.DropColumn(
                name: "Sexo",
                table: "Mascotas");

            migrationBuilder.DropColumn(
                name: "Hallazgos",
                table: "HistorialesClinicos");

            migrationBuilder.DropColumn(
                name: "MotivoConsulta",
                table: "HistorialesClinicos");

            migrationBuilder.DropColumn(
                name: "ProximoControl",
                table: "HistorialesClinicos");

            migrationBuilder.DropColumn(
                name: "Recomendaciones",
                table: "HistorialesClinicos");
        }
    }
}
