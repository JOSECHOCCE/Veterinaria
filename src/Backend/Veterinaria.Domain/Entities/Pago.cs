using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Veterinaria.Domain.Entities;

public class Pago
{
    public int Id { get; set; }

    // Foreign Key
    public int CitaId { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal Monto { get; set; }

    [MaxLength(20)]
    public string MetodoPago { get; set; } = "Tarjeta"; // "Tarjeta", "Efectivo"

    [MaxLength(20)]
    public string TipoPago { get; set; } = "Completo"; // "Completo", "Parcial", "Restante"

    [MaxLength(50)]
    public string? Referencia { get; set; } // Número de referencia del pago

    [MaxLength(20)]
    public string? UltimosDigitosTarjeta { get; set; } // Últimos 4 dígitos de la tarjeta

    [MaxLength(500)]
    public string? Observacion { get; set; } // Justificación si el monto total varía o notas adicionales

    public DateTime FechaPago { get; set; } = DateTime.Now;

    // Navegación
    public virtual Cita Cita { get; set; } = default!;
}
