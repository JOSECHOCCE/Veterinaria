using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Veterinaria.Application.Interfaces;
using Veterinaria.Domain.Contracts;
using Veterinaria.Domain.Entities;

namespace Veterinaria.Application.Services;

public class ConsentimientoService : IConsentimientoService
{
    private readonly IUnitOfWork _unitOfWork;

    public ConsentimientoService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<List<Consentimiento>> GetConsentimientosAsync(int? usuarioId)
    {
        var query = _unitOfWork.Consentimientos.GetAll()
            .Include(c => c.Usuario)
            .Include(c => c.Mascota)
            .AsQueryable();

        if (usuarioId.HasValue)
        {
            query = query.Where(c => c.UsuarioId == usuarioId.Value);
        }

        return await query
            .OrderByDescending(c => c.FechaCreacion)
            .ToListAsync();
    }

    public async Task<Usuario?> GetUsuarioByApplicationUserIdAsync(string applicationUserId)
    {
        return await _unitOfWork.Usuarios.GetAll()
            .FirstOrDefaultAsync(u => u.ApplicationUserId == applicationUserId);
    }

    public async Task AddConsentimientoAsync(Consentimiento consentimiento)
    {
        await _unitOfWork.Consentimientos.AddAsync(consentimiento);
        await _unitOfWork.CommitAsync();
    }

    public async Task<Consentimiento?> GetConsentimientoByIdAsync(int id)
    {
        return await _unitOfWork.Consentimientos.GetAll()
            .Include(c => c.Usuario)
            .Include(c => c.Mascota)
            .FirstOrDefaultAsync(c => c.Id == id);
    }
}
