using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Veterinaria.Domain.Entities;

public class Triage
{
    public int Id { get; set; }

    // FK a la cita (opcional, puede ser un ingreso sin cita previa)
    public int? CitaId { get; set; }

    public int MascotaId { get; set; }

    [Required]
    [MaxLength(20)]
    public string Nivel { get; set; } = "N3"; // "N1" (Emergencia), "N2" (Urgente), "N3" (No Urgente)

    [MaxLength(500)]
    public string? Sintomas { get; set; }

    [MaxLength(500)]
    public string? MotivoConsulta { get; set; }

    // Signos Vitales
    [Column(TypeName = "decimal(5,2)")]
    public decimal? Temperatura { get; set; }

    public int? FrecuenciaCardiaca { get; set; }

    [Column(TypeName = "decimal(5,2)")]
    public decimal? PesoEstimado { get; set; }

    [MaxLength(20)]
    public string? PrioridadColor { get; set; } // "Rojo", "Naranja", "Verde"

    public int TiempoEsperaEstimadoMin { get; set; }

    [MaxLength(100)]
    public string? Consultorio { get; set; } // "Sala de Shock", "Consultorio 1", "En Espera"

    [MaxLength(20)]
    public string Estado { get; set; } = "EnEspera"; // "EnEspera", "EnAtencion", "Atendido"

    public DateTime FechaRegistro { get; set; } = DateTime.Now;

    // Navegación
    public virtual Cita? Cita { get; set; }
    public virtual Mascota Mascota { get; set; } = default!;
}
