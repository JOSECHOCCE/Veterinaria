using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Veterinaria.Domain.Entities;

public class MovimientoInventario
{
    public int Id { get; set; }

    public int ProductoId { get; set; }

    [ForeignKey("ProductoId")]
    public Producto Producto { get; set; } = default!;

    [Required]
    [MaxLength(50)]
    public string TipoMovimiento { get; set; } = default!; // "Entrada", "SalidaVenta", "SalidaReceta", "Merma_Vencido", "Merma_Dañado", "Merma_Perdida", "Ajuste"

    public int Cantidad { get; set; }

    [MaxLength(250)]
    public string? Motivo { get; set; }

    public string RegistradoPor { get; set; } = "Sistema";

    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;
}
