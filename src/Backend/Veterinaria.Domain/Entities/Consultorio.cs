using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Veterinaria.Domain.Entities;

public class Consultorio
{
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Nombre { get; set; } = default!; // "Consultorio 1", "Consultorio 2", "Sala de Procedimientos", "Área de Grooming"

    [Required]
    [MaxLength(50)]
    public string TipoEspacio { get; set; } = "Consultorio"; // "Consultorio", "SalaProcedimientos", "AreaGrooming"

    public int Capacidad { get; set; } = 1;

    public bool Activo { get; set; } = true;

    // Navegación
    public virtual ICollection<Cita> Citas { get; set; } = new List<Cita>();
}
