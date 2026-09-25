using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Veterinaria.Domain.Entities;

public class RecordatorioVacuna
{
    public int Id { get; set; }

    public int MascotaId { get; set; }

    [ForeignKey("MascotaId")]
    public virtual Mascota? Mascota { get; set; }

    public int ClienteId { get; set; }

    [ForeignKey("ClienteId")]
    public virtual Usuario? Cliente { get; set; }

    [Required]
    [MaxLength(50)]
    public string TipoPrevencion { get; set; } = "Vacuna"; // "Vacuna", "Desparasitación", "Control"

    [Required]
    [MaxLength(100)]
    public string NombreVacuna { get; set; } = string.Empty;

    public DateTime FechaVencimiento { get; set; }

    public DateTime? FechaEnvioNotificacion { get; set; }

    [Required]
    [MaxLength(30)]
    public string Estado { get; set; } = "Programado"; // "Programado", "Notificado", "Atendido", "Vencido"
}
