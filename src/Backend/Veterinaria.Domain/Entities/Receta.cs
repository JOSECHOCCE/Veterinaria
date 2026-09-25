using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Veterinaria.Domain.Entities;

public class Receta
{
    public int Id { get; set; }

    public int HistorialClinicoId { get; set; }

    public int CitaId { get; set; }

    public int MascotaId { get; set; }

    public int VeterinarioId { get; set; }

    public DateTime FechaEmision { get; set; } = DateTime.UtcNow;

    [MaxLength(1000)]
    public string? IndicacionesGenerales { get; set; }

    // Navegación
    public virtual HistorialClinico HistorialClinico { get; set; } = default!;
    public virtual Cita Cita { get; set; } = default!;
    public virtual Mascota Mascota { get; set; } = default!;
    public virtual Veterinario Veterinario { get; set; } = default!;
    public virtual ICollection<DetalleReceta> Items { get; set; } = new List<DetalleReceta>();
}
