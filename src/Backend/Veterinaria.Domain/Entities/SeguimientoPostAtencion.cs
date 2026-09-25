using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Veterinaria.Domain.Entities;

public class SeguimientoPostAtencion
{
    public int Id { get; set; }

    public int HistorialClinicoId { get; set; }

    [ForeignKey("HistorialClinicoId")]
    public virtual HistorialClinico? HistorialClinico { get; set; }

    public int MascotaId { get; set; }

    [ForeignKey("MascotaId")]
    public virtual Mascota? Mascota { get; set; }

    public int ClienteId { get; set; }

    [ForeignKey("ClienteId")]
    public virtual Usuario? Cliente { get; set; }

    public int? VeterinarioId { get; set; }

    [ForeignKey("VeterinarioId")]
    public virtual Usuario? Veterinario { get; set; }

    public DateTime FechaProgramada { get; set; } = DateTime.UtcNow.AddDays(1);

    public DateTime? FechaContacto { get; set; }

    [Required]
    [MaxLength(30)]
    public string Estado { get; set; } = "Pendiente"; // "Pendiente", "Contactado", "SinRespuesta", "Revisión Requerida"

    [MaxLength(50)]
    public string? EvolucionPaciente { get; set; } // "Favorable", "Estable", "Complicación Minor", "Complicación Urgente"

    [MaxLength(1000)]
    public string? NotasSeguimiento { get; set; }

    public bool RequiereAtencionUrgente { get; set; } = false;
}
