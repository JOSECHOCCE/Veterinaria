using System;
using System.ComponentModel.DataAnnotations;

namespace Veterinaria.Domain.Entities;

public class BloqueoAgenda
{
    public int Id { get; set; }
    
    public int VeterinarioId { get; set; }
    
    public DateTime FechaInicio { get; set; }
    
    public DateTime FechaFin { get; set; }
    
    [Required]
    [MaxLength(200)]
    public string Motivo { get; set; } = default!; // Almuerzo, Descanso, Reunión, Ausencia, Procedimiento interno
    
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    public virtual Veterinario Veterinario { get; set; } = default!;
}
