using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Veterinaria.Application.Interfaces;
using Veterinaria.Application.DTOs;
using Veterinaria.Domain.Contracts;
using Veterinaria.Domain.Entities;

namespace Veterinaria.Application.Services;

public class AgendaService : IAgendaService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditoriaService _auditoriaService;

    public AgendaService(IUnitOfWork unitOfWork, IAuditoriaService auditoriaService)
    {
        _unitOfWork = unitOfWork;
        _auditoriaService = auditoriaService;
    }

    // Horario Clínica
    public async Task<IEnumerable<HorarioClinica>> GetHorariosClinicaAsync()
    {
        var horarios = await _unitOfWork.HorariosClinica.GetAll()
            .OrderBy(h => h.DiaSemana)
            .ToListAsync();

        if (!horarios.Any())
        {
            await InicializarHorariosClinicaDefectoAsync();
            horarios = await _unitOfWork.HorariosClinica.GetAll().OrderBy(h => h.DiaSemana).ToListAsync();
        }

        return horarios;
    }

    public async Task InicializarHorariosClinicaDefectoAsync()
    {
        var horarios = new List<HorarioClinica>();
        for (int i = 0; i < 7; i++)
        {
            horarios.Add(new HorarioClinica
            {
                DiaSemana = i,
                HoraApertura = new TimeSpan(8, 0, 0),
                HoraCierre = new TimeSpan(18, 0, 0),
                EsLaborable = i != 0 // Domingo no laborable por defecto
            });
        }
        await _unitOfWork.HorariosClinica.AddRangeAsync(horarios);
        await _unitOfWork.CommitAsync();
    }

    public async Task<Response<HorarioClinica>> ActualizarHorarioClinicaAsync(ActualizarHorarioClinicaDto dto, string currentUserId)
    {
        var horario = await _unitOfWork.HorariosClinica.GetAll()
            .FirstOrDefaultAsync(h => h.DiaSemana == dto.DiaSemana);

        if (horario == null)
            return Response<HorarioClinica>.Fail("Horario de clínica no encontrado.");

        horario.HoraApertura = dto.HoraApertura;
        horario.HoraCierre = dto.HoraCierre;
        horario.EsLaborable = dto.EsLaborable;

        _unitOfWork.HorariosClinica.Update(horario);
        await _unitOfWork.CommitAsync();

        await _auditoriaService.RegistrarAccionAsync("Actualizar", "HorarioClinica", horario.Id.ToString(), $"Día {dto.DiaSemana} actualizado. Laborable: {dto.EsLaborable}");

        return Response<HorarioClinica>.Ok(horario, "Horario actualizado exitosamente.");
    }

    // Horario Veterinario
    public async Task<IEnumerable<HorarioVeterinario>> GetHorariosVeterinarioAsync(int veterinarioId)
    {
        var veterinario = await _unitOfWork.Veterinarios.GetByIdAsync(veterinarioId);
        if (veterinario == null) return Enumerable.Empty<HorarioVeterinario>();

        var horarios = await _unitOfWork.HorariosVeterinario.GetAll()
            .Where(h => h.VeterinarioId == veterinarioId)
            .OrderBy(h => h.DiaSemana)
            .ToListAsync();

        if (!horarios.Any())
        {
            await InicializarHorariosVeterinarioDefectoAsync(veterinarioId);
            horarios = await _unitOfWork.HorariosVeterinario.GetAll()
                .Where(h => h.VeterinarioId == veterinarioId)
                .OrderBy(h => h.DiaSemana)
                .ToListAsync();
        }

        return horarios;
    }

    public async Task InicializarHorariosVeterinarioDefectoAsync(int veterinarioId)
    {
        var veterinario = await _unitOfWork.Veterinarios.GetByIdAsync(veterinarioId);
        if (veterinario == null) return;

        var horarios = new List<HorarioVeterinario>();
        for (int i = 0; i < 7; i++)
        {
            horarios.Add(new HorarioVeterinario
            {
                VeterinarioId = veterinarioId,
                DiaSemana = i,
                HoraInicio = veterinario.HorarioInicio, // heredado del vet original
                HoraFin = veterinario.HorarioFin,
                EsLaborable = i != 0, // Domingo no laborable
                DescansoInicio = new TimeSpan(13, 0, 0),
                DescansoFin = new TimeSpan(14, 0, 0)
            });
        }
        await _unitOfWork.HorariosVeterinario.AddRangeAsync(horarios);
        await _unitOfWork.CommitAsync();
    }

    public async Task<Response<HorarioVeterinario>> ActualizarHorarioVeterinarioAsync(ActualizarHorarioVeterinarioDto dto, string currentUserId)
    {
        var horario = await _unitOfWork.HorariosVeterinario.GetAll()
            .FirstOrDefaultAsync(h => h.VeterinarioId == dto.VeterinarioId && h.DiaSemana == dto.DiaSemana);

        if (horario == null)
        {
            horario = new HorarioVeterinario
            {
                VeterinarioId = dto.VeterinarioId,
                DiaSemana = dto.DiaSemana
            };
            await _unitOfWork.HorariosVeterinario.AddAsync(horario);
        }

        horario.HoraInicio = dto.HoraInicio;
        horario.HoraFin = dto.HoraFin;
        horario.EsLaborable = dto.EsLaborable;
        horario.DescansoInicio = dto.DescansoInicio;
        horario.DescansoFin = dto.DescansoFin;

        if (horario.Id > 0)
            _unitOfWork.HorariosVeterinario.Update(horario);
            
        await _unitOfWork.CommitAsync();

        await _auditoriaService.RegistrarAccionAsync("Actualizar", "HorarioVeterinario", horario.Id.ToString(), $"Día {dto.DiaSemana} del vet {dto.VeterinarioId} actualizado.");

        return Response<HorarioVeterinario>.Ok(horario, "Horario de veterinario actualizado.");
    }

    // Bloqueos
    public async Task<IEnumerable<BloqueoAgenda>> GetBloqueosAsync(int veterinarioId, DateTime fechaDesde, DateTime fechaHasta)
    {
        return await _unitOfWork.BloqueosAgenda.GetAll()
            .Where(b => b.VeterinarioId == veterinarioId && b.FechaInicio >= fechaDesde && b.FechaInicio <= fechaHasta)
            .OrderBy(b => b.FechaInicio)
            .ToListAsync();
    }

    public async Task<Response<BloqueoAgenda>> CrearBloqueoAsync(CrearBloqueoAgendaDto dto, string currentUserId)
    {
        if (dto.FechaInicio >= dto.FechaFin)
            return Response<BloqueoAgenda>.Fail("La fecha de inicio debe ser anterior a la fecha de fin.");

        // Validar que no haya citas cruzadas? Depende de la regla de negocio.
        // Lo ideal es advertir, o bloquear. Por ahora solo crearemos el bloqueo.
        var bloqueo = new BloqueoAgenda
        {
            VeterinarioId = dto.VeterinarioId,
            FechaInicio = dto.FechaInicio,
            FechaFin = dto.FechaFin,
            Motivo = dto.Motivo,
            FechaCreacion = DateTime.UtcNow
        };

        await _unitOfWork.BloqueosAgenda.AddAsync(bloqueo);
        await _unitOfWork.CommitAsync();

        await _auditoriaService.RegistrarAccionAsync("Crear", "BloqueoAgenda", bloqueo.Id.ToString(), $"Bloqueo creado para el vet {dto.VeterinarioId} del {dto.FechaInicio} al {dto.FechaFin}. Motivo: {dto.Motivo}");

        return Response<BloqueoAgenda>.Ok(bloqueo, "Bloqueo registrado exitosamente.");
    }

    public async Task<Response<bool>> EliminarBloqueoAsync(int id, string currentUserId)
    {
        var bloqueo = await _unitOfWork.BloqueosAgenda.GetByIdAsync(id);
        if (bloqueo == null)
            return Response<bool>.Fail("Bloqueo no encontrado.");

        _unitOfWork.BloqueosAgenda.Remove(bloqueo);
        await _unitOfWork.CommitAsync();

        await _auditoriaService.RegistrarAccionAsync("Eliminar", "BloqueoAgenda", id.ToString(), $"Bloqueo eliminado.");

        return Response<bool>.Ok(true, "Bloqueo eliminado exitosamente.");
    }
}
