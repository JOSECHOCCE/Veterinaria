using System.ComponentModel.DataAnnotations;

namespace Veterinaria.Domain.Entities;

public class Consentimiento
{
    public int Id { get; set; }

    public int UsuarioId { get; set; }

    public int? MascotaId { get; set; }

    [Required]
    [MaxLength(100)]
    public string TipoConsentimiento { get; set; } = "Anestesia General y Cirugía";

    [Required]
    [MaxLength(200)]
    public string NombrePropietario { get; set; } = default!;

    [MaxLength(100)]
    public string? NombrePaciente { get; set; }

    [MaxLength(50)]
    public string? DocumentoId { get; set; } // ID del documento ej: "FRM-2024-892"

    public bool Aceptado { get; set; }

    public DateTime? FechaAceptacion { get; set; }

    [MaxLength(45)]
    public string? IpOrigen { get; set; }

    [MaxLength(1000)]
    public string? Observaciones { get; set; }

    // Firma digital (base64)
    public string? FirmaDigital { get; set; }

    public DateTime FechaCreacion { get; set; } = DateTime.Now;

    // Navegación
    public virtual Usuario Usuario { get; set; } = default!;
    public virtual Mascota? Mascota { get; set; }
}
