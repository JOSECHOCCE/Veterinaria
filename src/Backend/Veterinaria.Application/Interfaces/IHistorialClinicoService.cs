using System.Collections.Generic;
using System.Threading.Tasks;
using Veterinaria.Domain.Entities;

namespace Veterinaria.Application.Interfaces;

public interface IHistorialClinicoService
{
    Task<Mascota?> GetMascotaWithUsuarioAsync(int mascotaId);
    // T8 SHOULD: por defecto solo cerrados (seguro para cliente); interno pasa incluirBorradores:true.
    Task<List<HistorialClinico>> GetHistorialesByMascotaIdAsync(int mascotaId, bool incluirBorradores = false);
    Task<Cita?> GetCitaForHistorialAsync(int citaId);
    Task<bool> ExistsHistorialForCitaAsync(int citaId);
    Task<HistorialClinico?> GetHistorialByCitaIdAsync(int citaId);
    Task<HistorialClinico?> GetHistorialByIdAsync(int id);
    
    Task<(bool Success, HistorialClinico? Historial, string? Error)> GuardarBorradorAsync(HistorialClinico historial, string? userEmail, bool isAdmin);
    Task<(bool Success, HistorialClinico? Historial, string? Error)> ActualizarBorradorAsync(HistorialClinico historial, string? userEmail, bool isAdmin);
    Task<(bool Success, string? Error)> CerrarAtencionAsync(int citaId, string? userEmail, bool isAdmin);
    Task<(bool Success, HistorialClinico? Historial, string? Error)> AgregarAddendumAsync(int historialId, string nota, string userEmail, bool isAdmin);
}
