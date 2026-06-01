using System;

namespace Veterinaria.Application.DTOs;

public class BloqueoAgendaDto
{
    public int Id { get; set; }
    public int VeterinarioId { get; set; }
    public DateTime FechaInicio { get; set; }
    public DateTime FechaFin { get; set; }
    public string Motivo { get; set; } = default!;
}

public class CrearBloqueoAgendaDto
{
    public int VeterinarioId { get; set; }
    public DateTime FechaInicio { get; set; }
    public DateTime FechaFin { get; set; }
    public string Motivo { get; set; } = default!;
}
