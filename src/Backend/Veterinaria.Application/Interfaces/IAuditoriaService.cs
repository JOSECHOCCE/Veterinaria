using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Veterinaria.Domain.Entities;

namespace Veterinaria.Application.Interfaces;

public interface IAuditoriaService
{
    Task RegistrarAccionAsync(string accion, string entidad, string entidadId, string detalle);
    Task RegistrarAccionAsync(int? usuarioId, string accion, string entidadNombre, string entidadId, string? datosPrevios, string? datosNuevos, string? ipAddress);
    Task<IEnumerable<AuditoriaLog>> ObtenerLogsAuditoriaAsync(DateTime? fechaInicio = null, DateTime? fechaFin = null);
}
