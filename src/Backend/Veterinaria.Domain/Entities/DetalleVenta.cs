using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Veterinaria.Domain.Entities;

public class DetalleVenta
{
    public int Id { get; set; }

    public int VentaId { get; set; }

    [ForeignKey("VentaId")]
    public virtual Venta Venta { get; set; } = default!;

    public int ProductoId { get; set; }

    [ForeignKey("ProductoId")]
    public virtual Producto Producto { get; set; } = default!;

    public int Cantidad { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal PrecioUnitario { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Subtotal { get; set; }
}
