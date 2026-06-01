using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Veterinaria.Domain.Entities;

public class Servicio
{
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Nombre { get; set; } = default!; // "Consulta", "Vacunación", "Cirugía", "Baño", "Desparasitación"

    [MaxLength(500)]
    public string? Descripcion { get; set; }

    public int DuracionMinutos { get; set; } // Ej: 30, 45, 120

    [Column(TypeName = "decimal(10,2)")]
    public decimal Precio { get; set; }

    public bool RequiereVeterinario { get; set; } = true;

    [MaxLength(100)]
    public string? EspecialidadRequerida { get; set; }

    public bool Activo { get; set; } = true;

    // Navegación
    public virtual ICollection<Cita> Citas { get; set; } = new List<Cita>();
}
