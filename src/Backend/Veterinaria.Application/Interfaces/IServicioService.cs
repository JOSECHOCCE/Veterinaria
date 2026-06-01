using System.Collections.Generic;
using System.Threading.Tasks;
using Veterinaria.Domain.Entities;
using Veterinaria.Application.DTOs;

namespace Veterinaria.Application.Interfaces;

public interface IServicioService
{
    IEnumerable<Servicio> GetServicios(string? q, bool? mostrarInactivos);
    Task<Servicio?> GetServicioWithCitasAsync(int id);
    Task<Servicio?> GetServicioByIdAsync(int id);
    Task<Response<Servicio>> CrearServicioAsync(CrearServicioDto dto, string currentUserId);
    Task<Response<Servicio>> EditarServicioAsync(int id, EditarServicioDto dto, string currentUserId);
    Task<Response<bool>> DeleteServicioAsync(int id, string currentUserId);
    Task<Response<bool>> ToggleActivoAsync(int id, string currentUserId);
}
