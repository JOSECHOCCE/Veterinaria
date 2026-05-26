using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Veterinaria.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPaymentFieldsToCita : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Pagos_CitaId",
                table: "Pagos");

            migrationBuilder.DropColumn(
                name: "FechaRegistro",
                table: "Pagos");

            migrationBuilder.RenameColumn(
                name: "Estado",
                table: "Pagos",
                newName: "TipoPago");

            migrationBuilder.AlterColumn<DateTime>(
                name: "FechaPago",
                table: "Pagos",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Referencia",
                table: "Pagos",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UltimosDigitosTarjeta",
                table: "Pagos",
                type: "nvarchar(4)",
                maxLength: 4,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EstadoPago",
                table: "Citas",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "MontoPagado",
                table: "Citas",
                type: "decimal(10,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "MontoTotal",
                table: "Citas",
                type: "decimal(10,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "TipoPago",
                table: "Citas",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Pagos_CitaId",
                table: "Pagos",
                column: "CitaId");

            migrationBuilder.CreateIndex(
                name: "IX_Pagos_Referencia",
                table: "Pagos",
                column: "Referencia",
                unique: true,
                filter: "[Referencia] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Pagos_CitaId",
                table: "Pagos");

            migrationBuilder.DropIndex(
                name: "IX_Pagos_Referencia",
                table: "Pagos");

            migrationBuilder.DropColumn(
                name: "Referencia",
                table: "Pagos");

            migrationBuilder.DropColumn(
                name: "UltimosDigitosTarjeta",
                table: "Pagos");

            migrationBuilder.DropColumn(
                name: "EstadoPago",
                table: "Citas");

            migrationBuilder.DropColumn(
                name: "MontoPagado",
                table: "Citas");

            migrationBuilder.DropColumn(
                name: "MontoTotal",
                table: "Citas");

            migrationBuilder.DropColumn(
                name: "TipoPago",
                table: "Citas");

            migrationBuilder.RenameColumn(
                name: "TipoPago",
                table: "Pagos",
                newName: "Estado");

            migrationBuilder.AlterColumn<DateTime>(
                name: "FechaPago",
                table: "Pagos",
                type: "datetime2",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "datetime2");

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaRegistro",
                table: "Pagos",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.CreateIndex(
                name: "IX_Pagos_CitaId",
                table: "Pagos",
                column: "CitaId",
                unique: true);
        }
    }
}
