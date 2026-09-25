using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Veterinaria.Application.Interfaces;
using Veterinaria.Domain.Entities;
using Veterinaria.Infrastructure.Persistence;

namespace Veterinaria.Web.Services;

public class AuditoriaService : IAuditoriaService
{
    private readonly VeterinariaDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AuditoriaService(VeterinariaDbContext context, IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task RegistrarAccionAsync(string accion, string entidad, string entidadId, string detalle)
    {
        var httpContext = _httpContextAccessor.HttpContext;
        int? usuarioIdInt = null;

        if (httpContext?.User?.Identity?.IsAuthenticated == true)
        {
            var uClaim = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(uClaim, out int uid))
            {
                usuarioIdInt = uid;
            }
        }

        string? ipAddress = httpContext?.Connection?.RemoteIpAddress?.ToString();

        await RegistrarAccionAsync(usuarioIdInt, accion, entidad, entidadId, null, detalle, ipAddress);
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

        _context.AuditoriaLogs.Add(log);
        await _context.SaveChangesAsync();
    }

    public async Task<IEnumerable<AuditoriaLog>> ObtenerLogsAuditoriaAsync(DateTime? fechaInicio = null, DateTime? fechaFin = null)
    {
        var query = _context.AuditoriaLogs
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
