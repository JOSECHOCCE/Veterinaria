using System.Collections.Generic;
using System.Threading.Tasks;
using Veterinaria.Domain.Entities;

namespace Veterinaria.Application.Interfaces;

public interface IHistorialClinicoService
{
    Task<Mascota?> GetMascotaWithUsuarioAsync(int mascotaId);
    Task<List<HistorialClinico>> GetHistorialesByMascotaIdAsync(int mascotaId);
    Task<Cita?> GetCitaForHistorialAsync(int citaId);
    Task<bool> ExistsHistorialForCitaAsync(int citaId);
    Task AddHistorialAsync(HistorialClinico historial);
    Task<HistorialClinico?> GetHistorialByCitaIdAsync(int citaId);
    Task<HistorialClinico?> GetHistorialByIdAsync(int id);
    Task UpdateHistorialAsync(HistorialClinico historial);
}
