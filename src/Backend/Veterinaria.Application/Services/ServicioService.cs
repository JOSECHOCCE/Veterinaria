using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Veterinaria.Application.Interfaces;
using Veterinaria.Application.DTOs;
using Veterinaria.Domain.Contracts;
using Veterinaria.Domain.Entities;

namespace Veterinaria.Application.Services;

public class ServicioService : IServicioService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditoriaService _auditoriaService;

    public ServicioService(IUnitOfWork unitOfWork, IAuditoriaService auditoriaService)
    {
        _unitOfWork = unitOfWork;
        _auditoriaService = auditoriaService;
    }

    public IEnumerable<Servicio> GetServicios(string? q, bool? mostrarInactivos)
    {
        var query = _unitOfWork.Servicios.GetAll().AsQueryable();

        if (mostrarInactivos != true)
        {
            query = query.Where(s => s.Activo);
        }

        if (!string.IsNullOrWhiteSpace(q))
        {
            q = q.ToLower();
            query = query.Where(s => s.Nombre.ToLower().Contains(q) || 
                                     (s.Descripcion != null && s.Descripcion.ToLower().Contains(q)));
        }

        return query.OrderBy(s => s.Nombre).ToList();
    }

    public async Task<Servicio?> GetServicioWithCitasAsync(int id)
    {
        return await _unitOfWork.Servicios.GetAll()
            .Include(s => s.Citas)
            .FirstOrDefaultAsync(s => s.Id == id);
    }

    public async Task<Servicio?> GetServicioByIdAsync(int id)
    {
        return await _unitOfWork.Servicios.GetByIdAsync(id);
    }

    private async Task<bool> ExistsNombreAsync(string nombre, int? excludeId = null)
    {
        var query = _unitOfWork.Servicios.GetAll()
            .Where(s => s.Nombre.ToLower() == nombre.ToLower());
            
        if (excludeId.HasValue)
        {
            query = query.Where(s => s.Id != excludeId.Value);
        }

        return await query.AnyAsync();
    }

    public async Task<Response<Servicio>> CrearServicioAsync(CrearServicioDto dto, string currentUserId)
    {
        if (await ExistsNombreAsync(dto.Nombre))
        {
            return Response<Servicio>.Fail("Ya existe un servicio con este nombre.");
        }

        var servicio = new Servicio
        {
            Nombre = dto.Nombre,
            Descripcion = dto.Descripcion,
            DuracionMinutos = dto.DuracionMinutos,
            Precio = dto.Precio,
            RequiereVeterinario = dto.RequiereVeterinario,
            EspecialidadRequerida = dto.EspecialidadRequerida,
            Activo = true
        };

        await _unitOfWork.Servicios.AddAsync(servicio);
        await _unitOfWork.CommitAsync();

        await _auditoriaService.RegistrarAccionAsync("Crear", "Servicio", servicio.Id.ToString(), $"Se creó el servicio '{servicio.Nombre}'.");

        return Response<Servicio>.Ok(servicio, "Servicio creado exitosamente.");
    }

    public async Task<Response<Servicio>> EditarServicioAsync(int id, EditarServicioDto dto, string currentUserId)
    {
        var servicio = await _unitOfWork.Servicios.GetByIdAsync(id);
        if (servicio == null)
        {
            return Response<Servicio>.Fail("Servicio no encontrado.");
        }

        if (await ExistsNombreAsync(dto.Nombre, id))
        {
            return Response<Servicio>.Fail("Ya existe un servicio con este nombre.");
        }

        servicio.Nombre = dto.Nombre;
        servicio.Descripcion = dto.Descripcion;
        servicio.DuracionMinutos = dto.DuracionMinutos;
        servicio.Precio = dto.Precio;
        servicio.RequiereVeterinario = dto.RequiereVeterinario;
        servicio.EspecialidadRequerida = dto.EspecialidadRequerida;

        _unitOfWork.Servicios.Update(servicio);
        await _unitOfWork.CommitAsync();

        await _auditoriaService.RegistrarAccionAsync("Editar", "Servicio", servicio.Id.ToString(), $"Se editó el servicio '{servicio.Nombre}'.");

        return Response<Servicio>.Ok(servicio, "Servicio actualizado exitosamente.");
    }

    public async Task<Response<bool>> DeleteServicioAsync(int id, string currentUserId)
    {
        var servicio = await GetServicioWithCitasAsync(id);
        if (servicio == null)
        {
            return Response<bool>.Fail("Servicio no encontrado.");
        }

        if (servicio.Citas.Any())
        {
            return Response<bool>.Fail("No se puede eliminar el servicio porque tiene citas asociadas. Puede desactivarlo en su lugar.");
        }

        _unitOfWork.Servicios.Remove(servicio);
        await _unitOfWork.CommitAsync();

        await _auditoriaService.RegistrarAccionAsync("Eliminar", "Servicio", id.ToString(), $"Se eliminó físicamente el servicio '{servicio.Nombre}'.");

        return Response<bool>.Ok(true, "Servicio eliminado exitosamente.");
    }

    public async Task<Response<bool>> ToggleActivoAsync(int id, string currentUserId)
    {
        var servicio = await _unitOfWork.Servicios.GetByIdAsync(id);
        if (servicio == null)
        {
            return Response<bool>.Fail("Servicio no encontrado.");
        }

        servicio.Activo = !servicio.Activo;
        _unitOfWork.Servicios.Update(servicio);
        await _unitOfWork.CommitAsync();

        var accion = servicio.Activo ? "Activar" : "Desactivar";
        await _auditoriaService.RegistrarAccionAsync(accion, "Servicio", id.ToString(), $"Se {accion.ToLower()}ó el servicio '{servicio.Nombre}'.");

        var message = servicio.Activo ? "Servicio activado exitosamente." : "Servicio desactivado exitosamente.";
        return Response<bool>.Ok(servicio.Activo, message);
    }
}
