using System.ComponentModel.DataAnnotations;

namespace Veterinaria.Domain.Entities;

public class Veterinario
{
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Nombre { get; set; } = default!;

    [MaxLength(100)]
    public string? Especialidad { get; set; }

    [MaxLength(150)]
    public string? Email { get; set; }

    [MaxLength(20)]
    public string? Telefono { get; set; }

    public TimeSpan HorarioInicio { get; set; } = new TimeSpan(8, 0, 0); // 08:00

    public TimeSpan HorarioFin { get; set; } = new TimeSpan(18, 0, 0); // 18:00

    public bool Activo { get; set; } = true;

    // Navegación
    public virtual ICollection<Cita> Citas { get; set; } = new List<Cita>();
}
