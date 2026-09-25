using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Veterinaria.Domain.Entities;

public class DetallePresupuesto
{
    public int Id { get; set; }

    public int PresupuestoId { get; set; }

    [Required]
    [MaxLength(200)]
    public string Concepto { get; set; } = default!;

    public int Cantidad { get; set; } = 1;

    [Column(TypeName = "decimal(10,2)")]
    public decimal PrecioUnitario { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal Subtotal { get; set; }

    // Navegación
    public virtual Presupuesto Presupuesto { get; set; } = default!;
}
