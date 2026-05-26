using System.ComponentModel.DataAnnotations;

namespace Veterinaria.Domain.Entities;

public class TarjetaGuardada
{
    public int Id { get; set; }

    // Foreign Key
    public int UsuarioId { get; set; }

    [Required]
    [MaxLength(100)]
    public string NombreTitular { get; set; } = default!;

    /// <summary>
    /// Número de tarjeta encriptado (solo para autocompletado, no procesamiento real)
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string NumeroTarjetaEncriptado { get; set; } = default!;

    /// <summary>
    /// Últimos 4 dígitos para mostrar al usuario
    /// </summary>
    [Required]
    [MaxLength(4)]
    public string UltimosDigitos { get; set; } = default!;

    [Required]
    [MaxLength(5)]
    public string FechaExpiracion { get; set; } = default!; // MM/YY

    /// <summary>
    /// CVV encriptado (solo para autocompletado, no procesamiento real)
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string CVVEncriptado { get; set; } = default!;

    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;

    public bool Activa { get; set; } = true;

    // Navegación
    public virtual Usuario Usuario { get; set; } = default!;
}
