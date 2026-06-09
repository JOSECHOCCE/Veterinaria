using System.Collections.Generic;
using System.Threading.Tasks;
using Veterinaria.Application.DTOs;

namespace Veterinaria.Application.Interfaces;

public interface IPortalClienteService
{
    Task<Response<PortalDashboardDto>> GetDashboardAsync(int usuarioId);
    Task<Response<IEnumerable<object>>> GetMisMascotasAsync(int usuarioId);
    Task<Response<object>> RegistrarMascotaAsync(int usuarioId, RegistrarMascotaPortalDto dto);
    Task<Response<IEnumerable<object>>> GetMisCitasAsync(int usuarioId);
    Task<Response<object>> SolicitarCitaAsync(int usuarioId, SolicitarCitaPortalDto dto);
    Task<Response<object>> CancelarCitaAsync(int usuarioId, int citaId);
    Task<Response<IEnumerable<object>>> GetHistorialMascotaAsync(int usuarioId, int mascotaId);
    Task<Response<object>> GetMisPagosAsync(int usuarioId);
    Task<Response<object>> GetMiPerfilAsync(int usuarioId);
    Task<Response<object>> ActualizarPerfilAsync(int usuarioId, ActualizarPerfilPortalDto dto);
}
