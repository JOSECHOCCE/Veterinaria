using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Veterinaria.Application.Interfaces;
using Veterinaria.Domain.Contracts;
using Veterinaria.Domain.Entities;

namespace Veterinaria.Application.Services;

public class TriageService : ITriageService
{
    private readonly IUnitOfWork _unitOfWork;

    public TriageService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<List<Triage>> GetColaTriageAsync()
    {
        return await _unitOfWork.Triages.GetAll()
            .Include(t => t.Mascota)
                .ThenInclude(m => m.Usuario)
            .Where(t => t.Estado == "EnEspera" || t.Estado == "EnAtencion")
            .OrderBy(t => t.Nivel == "N1" ? 0 : t.Nivel == "N2" ? 1 : 2)
            .ThenBy(t => t.FechaRegistro)
            .ToListAsync();
    }

    public async Task AddTriageAsync(Triage triage)
    {
        await _unitOfWork.Triages.AddAsync(triage);
        await _unitOfWork.CommitAsync();
    }

    public async Task<Triage?> GetTriageByIdAsync(int id)
    {
        return await _unitOfWork.Triages.GetByIdAsync(id);
    }

    public async Task UpdateTriageAsync(Triage triage)
    {
        _unitOfWork.Triages.Update(triage);
        await _unitOfWork.CommitAsync();
    }

    public async Task<List<Mascota>> GetMascotasActivasConUsuarioAsync()
    {
        return await _unitOfWork.Mascotas.GetAll()
            .Include(m => m.Usuario)
            .Where(m => m.Activo)
            .OrderBy(m => m.Nombre)
            .ToListAsync();
    }
}
