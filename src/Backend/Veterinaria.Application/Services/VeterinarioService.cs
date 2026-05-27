using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Veterinaria.Application.Interfaces;
using Veterinaria.Domain.Contracts;
using Veterinaria.Domain.Entities;

namespace Veterinaria.Application.Services;

public class VeterinarioService : IVeterinarioService
{
    private readonly IUnitOfWork _unitOfWork;

    public VeterinarioService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public IEnumerable<Veterinario> GetVeterinarios(string? especialidad, string? q)
    {
        var query = _unitOfWork.Veterinarios.GetAll()
            .Include(v => v.Citas)
            .Where(v => v.Activo)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(especialidad))
        {
            query = query.Where(v => v.Especialidad != null && v.Especialidad.ToLower().Contains(especialidad.ToLower()));
        }

        if (!string.IsNullOrWhiteSpace(q))
        {
            q = q.ToLower();
            query = query.Where(v => v.Nombre.ToLower().Contains(q) || 
                                     (v.Email != null && v.Email.ToLower().Contains(q)));
        }

        return query.OrderBy(v => v.Nombre).ToList();
    }

    public IEnumerable<string> GetEspecialidades()
    {
        return _unitOfWork.Veterinarios.GetAll()
            .Where(v => v.Activo && v.Especialidad != null)
            .Select(v => v.Especialidad!)
            .Distinct()
            .OrderBy(e => e)
            .ToList();
    }

    public async Task<Veterinario?> GetVeterinarioWithCitasAsync(int id)
    {
        return await _unitOfWork.Veterinarios.GetAll()
            .Include(v => v.Citas)
                .ThenInclude(c => c.Mascota)
            .Include(v => v.Citas)
                .ThenInclude(c => c.Servicio)
            .FirstOrDefaultAsync(v => v.Id == id);
    }

    public async Task<Veterinario?> GetVeterinarioByIdAsync(int id)
    {
        return await _unitOfWork.Veterinarios.GetByIdAsync(id);
    }

    public async Task AddVeterinarioAsync(Veterinario veterinario)
    {
        await _unitOfWork.Veterinarios.AddAsync(veterinario);
        await _unitOfWork.CommitAsync();
    }

    public async Task UpdateVeterinarioAsync(Veterinario veterinario)
    {
        _unitOfWork.Veterinarios.Update(veterinario);
        await _unitOfWork.CommitAsync();
    }

    public async Task<bool> DeleteVeterinarioAsync(int id)
    {
        var veterinario = await _unitOfWork.Veterinarios.GetByIdAsync(id);
        if (veterinario == null)
            return false;

        // Soft-delete: marcar como inactivo para preservar historial de citas
        veterinario.Activo = false;
        _unitOfWork.Veterinarios.Update(veterinario);
        await _unitOfWork.CommitAsync();
        return true;
    }
}
