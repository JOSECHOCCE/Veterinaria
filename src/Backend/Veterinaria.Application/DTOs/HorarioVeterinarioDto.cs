using System;

namespace Veterinaria.Application.DTOs;

public class HorarioVeterinarioDto
{
    public int Id { get; set; }
    public int VeterinarioId { get; set; }
    public int DiaSemana { get; set; }
    public TimeSpan HoraInicio { get; set; }
    public TimeSpan HoraFin { get; set; }
    public bool EsLaborable { get; set; }
    public TimeSpan? DescansoInicio { get; set; }
    public TimeSpan? DescansoFin { get; set; }
}

public class ActualizarHorarioVeterinarioDto
{
    public int VeterinarioId { get; set; }
    public int DiaSemana { get; set; }
    public TimeSpan HoraInicio { get; set; }
    public TimeSpan HoraFin { get; set; }
    public bool EsLaborable { get; set; }
    public TimeSpan? DescansoInicio { get; set; }
    public TimeSpan? DescansoFin { get; set; }
}
