using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Veterinaria.Application.DTOs;
using Veterinaria.Domain.Entities;

namespace Veterinaria.Application.Interfaces;

public interface IAgendaService
{
    // Horario Clínica
    Task<IEnumerable<HorarioClinica>> GetHorariosClinicaAsync();
    Task<Response<HorarioClinica>> ActualizarHorarioClinicaAsync(ActualizarHorarioClinicaDto dto, string currentUserId);
    Task InicializarHorariosClinicaDefectoAsync();

    // Horario Veterinario
    Task<IEnumerable<HorarioVeterinario>> GetHorariosVeterinarioAsync(int veterinarioId);
    Task<Response<HorarioVeterinario>> ActualizarHorarioVeterinarioAsync(ActualizarHorarioVeterinarioDto dto, string currentUserId);
    Task InicializarHorariosVeterinarioDefectoAsync(int veterinarioId);

    // Bloqueos
    Task<IEnumerable<BloqueoAgenda>> GetBloqueosAsync(int veterinarioId, DateTime fechaDesde, DateTime fechaHasta);
    Task<Response<BloqueoAgenda>> CrearBloqueoAsync(CrearBloqueoAgendaDto dto, string currentUserId);
    Task<Response<bool>> EliminarBloqueoAsync(int id, string currentUserId);
}
