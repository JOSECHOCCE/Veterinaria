using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Veterinaria.Domain.Entities;

namespace Veterinaria.Application.Interfaces;

public interface ICitaService
{
    Task<List<Cita>> GetCitasParaCalendarioAsync(DateTime? fechaInicio, DateTime? fechaFin);
    
    IQueryable<Cita> GetCitasQuery(bool isAdmin, int? currentUsuarioId, string? estado, int? veterinarioId, DateTime? fechaDesde, DateTime? fechaHasta);
    
    Task<Cita?> GetCitaDetailsAsync(int id, bool isAdmin, int? currentUsuarioId);
    
    Task<Cita?> GetCitaByIdAsync(int id);
    
    // Validations
    Task<bool> VeterinarioDisponibleAsync(int veterinarioId, DateTime fechaHora, int duracionMinutos, int? citaIdExcluir = null);
    Task<bool> MascotaTienePagosPendientesAsync(int mascotaId);
    Task<List<DateTime>> ObtenerHorariosDisponiblesAsync(int veterinarioId, DateTime fecha);
    Task<(bool EsValida, string? MensajeError)> ValidarFechaCitaAsync(int veterinarioId, DateTime fechaHora);
    
    // Commands
    Task<Cita> ReservaTemporalCitaAsync(Cita cita, decimal precioServicio);
    Task<Cita> CreateCitaAsync(Cita cita, decimal precioServicio);
    Task<Mascota> CreateMascotaAsync(Mascota mascota);
    Task<(bool Success, Cita? Cita)> EditCitaAsync(int id, string nuevoEstado, string? motivo, DateTime? nuevaFechaHora = null, int? nuevoVeterinarioId = null, string? reprogramadoPorUsuarioId = null);
    Task<(bool Success, Cita? Cita, string? Error)> CancelarCitaAsync(int id, bool isAdmin, int? currentUsuarioId);
    Task<(bool Success, Cita? Cita)> CompletarCitaAsync(int id);
    Task<(bool Success, Cita? Cita, string? Error)> CambiarEstadoAsync(int id, string nuevoEstado);
    Task<List<int>> GetCitasConTriageAsync(List<int> citaIds);
}
