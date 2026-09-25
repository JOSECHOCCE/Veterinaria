using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Veterinaria.Application.DTOs;
using Veterinaria.Domain.Entities;

namespace Veterinaria.Application.Interfaces;

public interface IConsultorioService
{
    Task<IEnumerable<ConsultorioDto>> GetConsultoriosAsync(bool incluirInactivos = false);
    Task<ConsultorioDto?> GetConsultorioByIdAsync(int id);
    Task<ConsultorioDto> CrearConsultorioAsync(CrearConsultorioDto dto);
    Task<bool> ActualizarConsultorioAsync(int id, CrearConsultorioDto dto);
    Task<bool> ToggleActivoAsync(int id);
    Task<IEnumerable<OcupacionConsultorioDto>> GetOcupacionRealTimeAsync(DateTime fecha);
}
