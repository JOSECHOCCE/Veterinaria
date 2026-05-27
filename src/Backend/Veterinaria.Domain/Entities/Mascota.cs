using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Veterinaria.Domain.Entities;

public class Mascota
{
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string Nombre { get; set; } = default!;

    [MaxLength(20)]
    public string Especie { get; set; } = default!; // "Perro", "Gato", "Ave", "Otro"

    [MaxLength(50)]
    public string? Raza { get; set; }

    public DateTime? FechaNacimiento { get; set; }

    [Column(TypeName = "decimal(5,2)")]
    public decimal? Peso { get; set; }

    [MaxLength(30)]
    public string? Color { get; set; }

    public string? FotoUrl { get; set; }

    public bool Activo { get; set; } = true;

    [MaxLength(10)]
    public string? Sexo { get; set; } // "Macho" o "Hembra"

    [MaxLength(500)]
    public string? ObservacionesGenerales { get; set; }

    [MaxLength(200)]
    public string? AlergiasConocidas { get; set; }

    // Foreign Key
    public int UsuarioId { get; set; }

    // Navegación
    public virtual Usuario Usuario { get; set; } = default!;

    public virtual ICollection<Cita> Citas { get; set; } = new List<Cita>();
}
