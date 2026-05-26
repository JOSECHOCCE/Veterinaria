using System.Collections.Generic;
using System.Threading.Tasks;
using Veterinaria.Domain.Entities;

namespace Veterinaria.Application.Interfaces;

public interface IServicioService
{
    IEnumerable<Servicio> GetServicios(string? q, bool? mostrarInactivos);
    Task<Servicio?> GetServicioWithCitasAsync(int id);
    Task<Servicio?> GetServicioByIdAsync(int id);
    Task<bool> ExistsNombreAsync(string nombre, int? excludeId = null);
    Task AddServicioAsync(Servicio servicio);
    Task UpdateServicioAsync(Servicio servicio);
    Task<bool> DeleteServicioAsync(int id);
    Task<bool> ToggleActivoAsync(int id);
}
