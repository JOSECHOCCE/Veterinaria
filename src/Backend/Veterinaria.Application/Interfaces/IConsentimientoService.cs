using System.Collections.Generic;
using System.Threading.Tasks;
using Veterinaria.Domain.Entities;

namespace Veterinaria.Application.Interfaces;

public interface IConsentimientoService
{
    Task<List<Consentimiento>> GetConsentimientosAsync(int? usuarioId);
    Task<Usuario?> GetUsuarioByApplicationUserIdAsync(string applicationUserId);
    Task AddConsentimientoAsync(Consentimiento consentimiento);
    Task<Consentimiento?> GetConsentimientoByIdAsync(int id);
}
