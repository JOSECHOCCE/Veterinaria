using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Veterinaria.Domain.Entities;

namespace Veterinaria.Application.Interfaces;

public interface IMascotaService
{
    IQueryable<Mascota> GetActiveMascotasWithUsuariosQuery();
    Task<Mascota?> GetMascotaWithDetailsAsync(int id);
    Task<Mascota?> GetMascotaByIdAsync(int id);
    Task<Mascota?> GetMascotaWithUsuarioAsync(int id);
    Task AddMascotaAsync(Mascota mascota);
    Task UpdateMascotaAsync(Mascota mascota);
    Task DeleteMascotaAsync(int id);
    Task<IEnumerable<Usuario>> GetActiveUsuariosAsync();
}
