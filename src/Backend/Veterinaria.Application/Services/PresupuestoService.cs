using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Veterinaria.Application.Interfaces;
using Veterinaria.Domain.Contracts;
using Veterinaria.Domain.Entities;

namespace Veterinaria.Application.Services;

public class PresupuestoService : IPresupuestoService
{
    private readonly IUnitOfWork _unitOfWork;

    public PresupuestoService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Presupuesto?> GetPresupuestoByIdAsync(int id)
    {
        return await _unitOfWork.Presupuestos.GetAll()
            .Include(p => p.Items)
            .Include(p => p.Cita)
            .Include(p => p.Mascota)
            .Include(p => p.Veterinario)
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<List<Presupuesto>> GetPresupuestosByCitaIdAsync(int citaId)
    {
        return await _unitOfWork.Presupuestos.GetAll()
            .Include(p => p.Items)
            .Where(p => p.CitaId == citaId)
            .OrderByDescending(p => p.FechaCreacion)
            .ToListAsync();
    }

    public async Task<Presupuesto> CrearPresupuestoAsync(Presupuesto presupuesto)
    {
        if (presupuesto.Items != null && presupuesto.Items.Any())
        {
            foreach (var item in presupuesto.Items)
            {
                item.Subtotal = item.Cantidad * item.PrecioUnitario;
            }
            presupuesto.MontoTotal = presupuesto.Items.Sum(i => i.Subtotal);
        }

        presupuesto.FechaCreacion = DateTime.UtcNow;
        presupuesto.Estado = "PendienteAprobacion";

        await _unitOfWork.Presupuestos.AddAsync(presupuesto);
        await _unitOfWork.CommitAsync();

        return presupuesto;
    }

    public async Task<(bool Success, Presupuesto? Presupuesto, string? Error)> ResponderPresupuestoAsync(int presupuestoId, bool aceptado)
    {
        var presupuesto = await GetPresupuestoByIdAsync(presupuestoId);
        if (presupuesto == null)
            return (false, null, "Presupuesto no encontrado.");

        presupuesto.Estado = aceptado ? "Aceptado" : "Rechazado";
        presupuesto.FechaRespuesta = DateTime.UtcNow;

        _unitOfWork.Presupuestos.Update(presupuesto);
        await _unitOfWork.CommitAsync();

        return (true, presupuesto, null);
    }
}
