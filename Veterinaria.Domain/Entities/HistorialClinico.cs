using System.ComponentModel.DataAnnotations;

namespace Veterinaria.Domain.Entities;

public class HistorialClinico
{
    public int Id { get; set; }

    // Foreign Key (unique - relación uno a uno)
    public int CitaId { get; set; }

    [Required]
    [MaxLength(1000)]
    public string Diagnostico { get; set; } = default!;

    [MaxLength(1000)]
    public string? Tratamiento { get; set; }

    [MaxLength(500)]
    public string? Medicamentos { get; set; }

    [MaxLength(1000)]
    public string? Observaciones { get; set; }

    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;

    // Navegación
    public virtual Cita Cita { get; set; } = default!;
}
