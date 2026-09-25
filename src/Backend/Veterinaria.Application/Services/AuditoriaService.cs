using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Veterinaria.Application.Interfaces;
using Veterinaria.Domain.Contracts;
using Veterinaria.Domain.Entities;

namespace Veterinaria.Application.Services;

public class AuditoriaService : IAuditoriaService
{
    private readonly IUnitOfWork _unitOfWork;

    public AuditoriaService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task RegistrarAccionAsync(string accion, string entidad, string entidadId, string detalle)
    {
        await RegistrarAccionAsync(null, accion, entidad, entidadId, null, detalle, null);
    }

    public async Task RegistrarAccionAsync(int? usuarioId, string accion, string entidadNombre, string entidadId, string? datosPrevios, string? datosNuevos, string? ipAddress)
    {
        var log = new AuditoriaLog
        {
            UsuarioId = usuarioId,
            Accion = accion,
            EntidadNombre = entidadNombre,
            EntidadId = entidadId,
            DatosPreviosJson = datosPrevios,
            DatosNuevosJson = datosNuevos,
            IpAddress = ipAddress,
            Fecha = DateTime.UtcNow
        };

        await _unitOfWork.AuditoriaLogs.AddAsync(log);
        await _unitOfWork.CommitAsync();
    }

    public async Task<IEnumerable<AuditoriaLog>> ObtenerLogsAuditoriaAsync(DateTime? fechaInicio = null, DateTime? fechaFin = null)
    {
        var query = _unitOfWork.AuditoriaLogs.GetAll()
            .Include(a => a.Usuario)
            .AsQueryable();

        if (fechaInicio.HasValue)
        {
            query = query.Where(a => a.Fecha >= fechaInicio.Value);
        }

        if (fechaFin.HasValue)
        {
            query = query.Where(a => a.Fecha <= fechaFin.Value);
        }

        return await query.OrderByDescending(a => a.Fecha).ToListAsync();
    }
}
