using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Veterinaria.Application.Interfaces;
using Veterinaria.Domain.Contracts;
using Veterinaria.Domain.Entities;

namespace Veterinaria.Application.Services;

public class HistorialClinicoService : IHistorialClinicoService
{
    private readonly IUnitOfWork _unitOfWork;

    public HistorialClinicoService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Mascota?> GetMascotaWithUsuarioAsync(int mascotaId)
    {
        return await _unitOfWork.Mascotas.GetAll()
            .Include(m => m.Usuario)
            .FirstOrDefaultAsync(m => m.Id == mascotaId);
    }

    public async Task<List<HistorialClinico>> GetHistorialesByMascotaIdAsync(int mascotaId)
    {
        return await _unitOfWork.HistorialesClinicos.GetAll()
            .Include(h => h.Cita)
                .ThenInclude(c => c.Veterinario)
            .Include(h => h.Cita)
                .ThenInclude(c => c.Servicio)
            .Where(h => h.Cita.MascotaId == mascotaId)
            .OrderByDescending(h => h.Cita.FechaHora)
            .ToListAsync();
    }

    public async Task<Cita?> GetCitaForHistorialAsync(int citaId)
    {
        return await _unitOfWork.Citas.GetAll()
            .Include(c => c.Mascota)
                .ThenInclude(m => m.Usuario)
            .Include(c => c.Veterinario)
            .Include(c => c.Servicio)
            .FirstOrDefaultAsync(c => c.Id == citaId);
    }

    public async Task<bool> ExistsHistorialForCitaAsync(int citaId)
    {
        return await _unitOfWork.HistorialesClinicos.GetAll()
            .AnyAsync(h => h.CitaId == citaId);
    }

    public async Task AddHistorialAsync(HistorialClinico historial)
    {
        await _unitOfWork.HistorialesClinicos.AddAsync(historial);
        await _unitOfWork.CommitAsync();
    }

    public async Task<HistorialClinico?> GetHistorialByCitaIdAsync(int citaId)
    {
        return await _unitOfWork.HistorialesClinicos.GetAll()
            .Include(h => h.Cita)
                .ThenInclude(c => c.Mascota)
                    .ThenInclude(m => m.Usuario)
            .Include(h => h.Cita)
                .ThenInclude(c => c.Veterinario)
            .Include(h => h.Cita)
                .ThenInclude(c => c.Servicio)
            .FirstOrDefaultAsync(h => h.CitaId == citaId);
    }

    public async Task<HistorialClinico?> GetHistorialByIdAsync(int id)
    {
        return await _unitOfWork.HistorialesClinicos.GetAll()
            .Include(h => h.Cita)
                .ThenInclude(c => c.Mascota)
                    .ThenInclude(m => m.Usuario)
            .Include(h => h.Cita)
                .ThenInclude(c => c.Veterinario)
            .Include(h => h.Cita)
                .ThenInclude(c => c.Servicio)
            .FirstOrDefaultAsync(h => h.Id == id);
    }

    public async Task UpdateHistorialAsync(HistorialClinico historial)
    {
        _unitOfWork.HistorialesClinicos.Update(historial);
        await _unitOfWork.CommitAsync();
    }
}
