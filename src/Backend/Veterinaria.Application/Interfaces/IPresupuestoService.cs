using System.Collections.Generic;
using System.Threading.Tasks;
using Veterinaria.Domain.Entities;

namespace Veterinaria.Application.Interfaces;

public interface IPresupuestoService
{
    Task<Presupuesto?> GetPresupuestoByIdAsync(int id);
    Task<List<Presupuesto>> GetPresupuestosByCitaIdAsync(int citaId);
    Task<Presupuesto> CrearPresupuestoAsync(Presupuesto presupuesto);
    Task<(bool Success, Presupuesto? Presupuesto, string? Error)> ResponderPresupuestoAsync(int presupuestoId, bool aceptado);
}
