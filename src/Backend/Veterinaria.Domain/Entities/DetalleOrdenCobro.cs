using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Veterinaria.Domain.Entities;

public class DetalleOrdenCobro
{
    public int Id { get; set; }

    public int OrdenCobroId { get; set; }

    [ForeignKey("OrdenCobroId")]
    public virtual OrdenCobro OrdenCobro { get; set; } = default!;

    [Required]
    [MaxLength(50)]
    public string TipoItem { get; set; } = "Servicio"; // "Consulta", "Medicamento", "Procedimiento", "Servicio"

    public int? ProductoId { get; set; }

    [ForeignKey("ProductoId")]
    public virtual Producto? Producto { get; set; }

    public int? ServicioId { get; set; }

    [ForeignKey("ServicioId")]
    public virtual Servicio? Servicio { get; set; }

    [Required]
    [MaxLength(200)]
    public string Descripcion { get; set; } = default!;

    public int Cantidad { get; set; } = 1;

    [Column(TypeName = "decimal(18,2)")]
    public decimal PrecioUnitario { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Subtotal { get; set; }
}
