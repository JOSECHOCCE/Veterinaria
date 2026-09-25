using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Veterinaria.Domain.Entities;

public class Presupuesto
{
    public int Id { get; set; }

    public int CitaId { get; set; }

    public int MascotaId { get; set; }

    public int UsuarioId { get; set; }

    public int VeterinarioId { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal MontoTotal { get; set; }

    [Required]
    [MaxLength(50)]
    public string Estado { get; set; } = "Borrador"; // Borrador, PendienteAprobacion, Aceptado, Rechazado

    [MaxLength(500)]
    public string? Observaciones { get; set; }

    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    public DateTime? FechaRespuesta { get; set; }

    // Navegación
    public virtual Cita Cita { get; set; } = default!;
    public virtual Mascota Mascota { get; set; } = default!;
    public virtual Usuario Usuario { get; set; } = default!;
    public virtual Veterinario Veterinario { get; set; } = default!;
    public virtual ICollection<DetallePresupuesto> Items { get; set; } = new List<DetallePresupuesto>();
}
