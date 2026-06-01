using System.ComponentModel.DataAnnotations;

namespace Veterinaria.Domain.Entities;

public class Usuario
{
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Nombre { get; set; } = default!;

    [Required]
    [MaxLength(150)]
    public string Email { get; set; } = default!;

    [MaxLength(20)]
    public string? DNI { get; set; }

    [MaxLength(20)]
    public string? Telefono { get; set; }

    [MaxLength(200)]
    public string? Direccion { get; set; }

    [MaxLength(20)]
    public string Rol { get; set; } = "Cliente"; // "Admin", "Veterinario", "Recepcionista", "Cliente"

    public bool Activo { get; set; } = true;

    public bool RecibirRecordatorios { get; set; } = true; // Preferencia del cliente para recordatorios no críticos

    public DateTime FechaRegistro { get; set; }

    // Vínculo con Identity
    [MaxLength(450)]
    public string? ApplicationUserId { get; set; }

    // Navegación
    public virtual ICollection<Mascota> Mascotas { get; set; } = new List<Mascota>();

    [MaxLength(500)]
    public string? Observaciones { get; set; }
}
