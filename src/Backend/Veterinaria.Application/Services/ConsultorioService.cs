using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Veterinaria.Application.DTOs;
using Veterinaria.Application.Interfaces;
using Veterinaria.Domain.Contracts;
using Veterinaria.Domain.Entities;

namespace Veterinaria.Application.Services;

public class ConsultorioService : IConsultorioService
{
    private readonly IUnitOfWork _unitOfWork;

    public ConsultorioService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<ConsultorioDto>> GetConsultoriosAsync(bool incluirInactivos = false)
    {
        var query = _unitOfWork.Consultorios.GetAll();
        if (!incluirInactivos)
        {
            query = query.Where(c => c.Activo);
        }

        var list = await query.ToListAsync();
        return list.Select(MapToDto);
    }

    public async Task<ConsultorioDto?> GetConsultorioByIdAsync(int id)
    {
        var item = await _unitOfWork.Consultorios.GetByIdAsync(id);
        return item == null ? null : MapToDto(item);
    }

    public async Task<ConsultorioDto> CrearConsultorioAsync(CrearConsultorioDto dto)
    {
        var entity = new Consultorio
        {
            Nombre = dto.Nombre,
            TipoEspacio = dto.TipoEspacio,
            Capacidad = dto.Capacidad,
            Activo = true
        };

        await _unitOfWork.Consultorios.AddAsync(entity);
        await _unitOfWork.CommitAsync();

        return MapToDto(entity);
    }

    public async Task<bool> ActualizarConsultorioAsync(int id, CrearConsultorioDto dto)
    {
        var entity = await _unitOfWork.Consultorios.GetByIdAsync(id);
        if (entity == null) return false;

        entity.Nombre = dto.Nombre;
        entity.TipoEspacio = dto.TipoEspacio;
        entity.Capacidad = dto.Capacidad;

        _unitOfWork.Consultorios.Update(entity);
        await _unitOfWork.CommitAsync();
        return true;
    }

    public async Task<bool> ToggleActivoAsync(int id)
    {
        var entity = await _unitOfWork.Consultorios.GetByIdAsync(id);
        if (entity == null) return false;

        entity.Activo = !entity.Activo;
        _unitOfWork.Consultorios.Update(entity);
        await _unitOfWork.CommitAsync();
        return true;
    }

    public async Task<IEnumerable<OcupacionConsultorioDto>> GetOcupacionRealTimeAsync(DateTime fecha)
    {
        var consultorios = await _unitOfWork.Consultorios.GetAll()
            .Where(c => c.Activo)
            .ToListAsync();

        var citasDelDia = await _unitOfWork.Citas.GetAll()
            .Include(c => c.Mascota)
            .Include(c => c.Veterinario)
            .Include(c => c.Servicio)
            .Where(c => c.FechaHora.Date == fecha.Date && c.Estado != "Cancelada")
            .ToListAsync();

        var result = new List<OcupacionConsultorioDto>();

        foreach (var c in consultorios)
        {
            var citaActiva = citasDelDia
                .FirstOrDefault(cita => cita.ConsultorioId == c.Id && (cita.Estado == "EnProceso" || cita.Estado == "Confirmada" || cita.Estado == "Pendiente"));

            result.Add(new OcupacionConsultorioDto
            {
                ConsultorioId = c.Id,
                Nombre = c.Nombre,
                TipoEspacio = c.TipoEspacio,
                Estado = citaActiva != null ? "Ocupado" : "Libre",
                CitaActual = citaActiva?.Servicio?.Nombre,
                MascotaNombre = citaActiva?.Mascota?.Nombre,
                VeterinarioNombre = citaActiva?.Veterinario?.Nombre,
                HoraInicio = citaActiva?.FechaHora.ToString("HH:mm"),
                HoraFin = citaActiva?.FechaHora.AddMinutes(citaActiva.Servicio?.DuracionMinutos ?? 30).ToString("HH:mm")
            });
        }

        return result;
    }

    private static ConsultorioDto MapToDto(Consultorio c) => new()
    {
        Id = c.Id,
        Nombre = c.Nombre,
        TipoEspacio = c.TipoEspacio,
        Capacidad = c.Capacidad,
        Activo = c.Activo
    };
}
