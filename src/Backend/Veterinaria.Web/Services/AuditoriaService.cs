using Microsoft.AspNetCore.Http;
using System;
using System.Security.Claims;
using System.Threading.Tasks;
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
        string? usuarioId = null;
        string? usuarioEmail = null;

        if (httpContext?.User?.Identity?.IsAuthenticated == true)
        {
            usuarioId = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            usuarioEmail = httpContext.User.FindFirst(ClaimTypes.Email)?.Value ?? httpContext.User.Identity.Name;
        }

        var auditoria = new Auditoria
        {
            UsuarioId = usuarioId,
            UsuarioEmail = usuarioEmail ?? "Sistema/Anónimo",
            Accion = accion,
            Entidad = entidad,
            EntidadId = entidadId,
            Detalle = detalle,
            Fecha = DateTime.UtcNow
        };

        _context.Auditorias.Add(auditoria);
        await _context.SaveChangesAsync();
    }
}
