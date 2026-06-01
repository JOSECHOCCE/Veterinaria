using System;

namespace Veterinaria.Application.DTOs;

public class HorarioClinicaDto
{
    public int Id { get; set; }
    public int DiaSemana { get; set; }
    public TimeSpan HoraApertura { get; set; }
    public TimeSpan HoraCierre { get; set; }
    public bool EsLaborable { get; set; }
}

public class ActualizarHorarioClinicaDto
{
    public int DiaSemana { get; set; }
    public TimeSpan HoraApertura { get; set; }
    public TimeSpan HoraCierre { get; set; }
    public bool EsLaborable { get; set; }
}
