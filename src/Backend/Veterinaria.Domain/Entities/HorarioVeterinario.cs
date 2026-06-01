using System;
using System.ComponentModel.DataAnnotations;

namespace Veterinaria.Domain.Entities;

public class HorarioVeterinario
{
    public int Id { get; set; }
    
    public int VeterinarioId { get; set; }
    
    /// <summary>
    /// 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
    /// </summary>
    public int DiaSemana { get; set; }
    
    public TimeSpan HoraInicio { get; set; } = new TimeSpan(8, 0, 0); // 08:00
    
    public TimeSpan HoraFin { get; set; } = new TimeSpan(18, 0, 0); // 18:00
    
    public bool EsLaborable { get; set; } = true;
    
    public TimeSpan? DescansoInicio { get; set; }
    
    public TimeSpan? DescansoFin { get; set; }

    public virtual Veterinario Veterinario { get; set; } = default!;
}
