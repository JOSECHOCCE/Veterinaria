using System;

namespace Veterinaria.Domain.Entities;

public class HorarioClinica
{
    public int Id { get; set; }
    
    /// <summary>
    /// 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
    /// </summary>
    public int DiaSemana { get; set; }
    
    public TimeSpan HoraApertura { get; set; } = new TimeSpan(8, 0, 0); // 08:00
    
    public TimeSpan HoraCierre { get; set; } = new TimeSpan(18, 0, 0); // 18:00
    
    public bool EsLaborable { get; set; } = true;
}
