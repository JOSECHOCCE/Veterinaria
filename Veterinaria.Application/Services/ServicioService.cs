using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Veterinaria.Application.Interfaces;
using Veterinaria.Domain.Contracts;
using Veterinaria.Domain.Entities;

namespace Veterinaria.Application.Services;

public class ServicioService : IServicioService
{
    private readonly IUnitOfWork _unitOfWork;

    public ServicioService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
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

    public async Task<bool> ExistsNombreAsync(string nombre, int? excludeId = null)
    {
        var query = _unitOfWork.Servicios.GetAll()
            .Where(s => s.Nombre.ToLower() == nombre.ToLower());
            
        if (excludeId.HasValue)
        {
            query = query.Where(s => s.Id != excludeId.Value);
        }

        return await query.AnyAsync();
    }

    public async Task AddServicioAsync(Servicio servicio)
    {
        await _unitOfWork.Servicios.AddAsync(servicio);
        await _unitOfWork.CommitAsync();
    }

    public async Task UpdateServicioAsync(Servicio servicio)
    {
        _unitOfWork.Servicios.Update(servicio);
        await _unitOfWork.CommitAsync();
    }

    public async Task<bool> DeleteServicioAsync(int id)
    {
        var servicio = await _unitOfWork.Servicios.GetAll()
            .Include(s => s.Citas)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (servicio == null)
        {
            return false;
        }

        if (servicio.Citas.Any())
        {
            return false;
        }

        _unitOfWork.Servicios.Remove(servicio);
        await _unitOfWork.CommitAsync();
        return true;
    }

    public async Task<bool> ToggleActivoAsync(int id)
    {
        var servicio = await _unitOfWork.Servicios.GetByIdAsync(id);
        if (servicio == null)
        {
            return false;
        }

        servicio.Activo = !servicio.Activo;
        _unitOfWork.Servicios.Update(servicio);
        await _unitOfWork.CommitAsync();
        return true;
    }
}
