using System.Collections.Generic;
using System.Threading.Tasks;
using Veterinaria.Domain.Entities;
using Veterinaria.Application.DTOs;

namespace Veterinaria.Application.Interfaces;

public interface IMascotaService
{
    Task<(List<Mascota> Mascotas, int Total)> GetMascotasPaginatedAsync(string? q, int page, string userId, bool isCliente);
    Task<Mascota?> GetMascotaWithDetailsAsync(int id);
    Task<Mascota?> GetMascotaByIdAsync(int id);
    Task<MascotaAlertasDto> GetAlertasMascotaAsync(int id);
    Task<Response<Mascota>> CrearMascotaAsync(CrearMascotaDto dto, string userId, bool isAdmin);
    Task<Response<Mascota>> EditarMascotaAsync(int id, EditarMascotaDto dto);
    Task<Response<bool>> DeleteMascotaAsync(int id);
    Task<IEnumerable<Usuario>> GetActiveUsuariosAsync();
}
