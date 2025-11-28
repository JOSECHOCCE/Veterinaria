using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Veterinaria.Domain.Entities;

public class Cita
{
    public int Id { get; set; }

    public DateTime FechaHora { get; set; }

    [MaxLength(20)]
    public string Estado { get; set; } = "Pendiente"; // "Pendiente", "Confirmada", "EnProceso", "Completada", "Cancelada", "NoAsistio"

    [MaxLength(300)]
    public string? Motivo { get; set; }

    // Información de Pago
    [MaxLength(20)]
    public string TipoPago { get; set; } = "Completo"; // "Completo", "Parcial"

    [Column(TypeName = "decimal(10,2)")]
    public decimal MontoTotal { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal MontoPagado { get; set; }

    [MaxLength(20)]
    public string EstadoPago { get; set; } = "Pendiente"; // "Pendiente", "Parcial", "Pagado"

    // Foreign Keys
    public int MascotaId { get; set; }
    public int VeterinarioId { get; set; }
    public int ServicioId { get; set; }

    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    // Navegación
    public virtual Mascota Mascota { get; set; } = default!;
    public virtual Veterinario Veterinario { get; set; } = default!;
    public virtual Servicio Servicio { get; set; } = default!;

    // Relaciones
    public virtual HistorialClinico? Historial { get; set; }
    public virtual ICollection<Pago> Pagos { get; set; } = new List<Pago>();
}
