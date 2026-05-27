using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Veterinaria.Application.Interfaces;
using Veterinaria.Domain.Contracts;
using Veterinaria.Domain.Entities;

namespace Veterinaria.Application.Services;

public class MascotaService : IMascotaService
{
    private readonly IUnitOfWork _unitOfWork;

    public MascotaService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public IQueryable<Mascota> GetActiveMascotasWithUsuariosQuery()
    {
        return _unitOfWork.Mascotas.GetAll()
            .Include(m => m.Usuario)
            .Where(m => m.Activo)
            .AsQueryable();
    }

    public async Task<Mascota?> GetMascotaWithDetailsAsync(int id)
    {
        return await _unitOfWork.Mascotas.GetAll()
            .Include(m => m.Usuario)
            .Include(m => m.Citas)
                .ThenInclude(c => c.Servicio)
            .Include(m => m.Citas)
                .ThenInclude(c => c.Veterinario)
            .FirstOrDefaultAsync(m => m.Id == id);
    }

    public async Task<Mascota?> GetMascotaByIdAsync(int id)
    {
        return await _unitOfWork.Mascotas.GetByIdAsync(id);
    }

    public async Task<Mascota?> GetMascotaWithUsuarioAsync(int id)
    {
        return await _unitOfWork.Mascotas.GetAll()
            .Include(m => m.Usuario)
            .FirstOrDefaultAsync(m => m.Id == id);
    }

    public async Task AddMascotaAsync(Mascota mascota)
    {
        await _unitOfWork.Mascotas.AddAsync(mascota);
        await _unitOfWork.CommitAsync();
    }

    public async Task UpdateMascotaAsync(Mascota mascota)
    {
        _unitOfWork.Mascotas.Update(mascota);
        await _unitOfWork.CommitAsync();
    }

    public async Task DeleteMascotaAsync(int id)
    {
        var mascota = await _unitOfWork.Mascotas.GetByIdAsync(id);
        if (mascota != null)
        {
            // Soft-delete: marcar como inactiva en vez de eliminar físicamente
            // para preservar datos históricos (citas, historiales clínicos, pagos)
            mascota.Activo = false;
            _unitOfWork.Mascotas.Update(mascota);

            // RF-13: Cancelar citas futuras pendientes/confirmadas de esta mascota
            var citasFuturas = await _unitOfWork.Citas.GetAll()
                .Where(c => c.MascotaId == id
                    && (c.Estado == "Pendiente" || c.Estado == "Confirmada")
                    && c.FechaHora > DateTime.Now)
                .ToListAsync();
            foreach (var cita in citasFuturas)
            {
                cita.Estado = "Cancelada";
                _unitOfWork.Citas.Update(cita);
            }

            await _unitOfWork.CommitAsync();
        }
    }

    public async Task<IEnumerable<Usuario>> GetActiveUsuariosAsync()
    {
        return await _unitOfWork.Usuarios.GetAll()
            .Where(u => u.Activo)
            .OrderBy(u => u.Nombre)
            .ToListAsync();
    }
}
