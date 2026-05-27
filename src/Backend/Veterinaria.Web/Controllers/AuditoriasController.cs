using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Veterinaria.Application.DTOs;
using Veterinaria.Domain.Entities;
using Veterinaria.Infrastructure.Persistence;

namespace Veterinaria.Web.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/[controller]")]
public class AuditoriasController : ControllerBase
{
    private readonly VeterinariaDbContext _context;

    public AuditoriasController(VeterinariaDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<Response<List<Auditoria>>>> GetAuditorias(
        [FromQuery] string? usuarioEmail,
        [FromQuery] string? accion,
        [FromQuery] string? entidad,
        [FromQuery] DateTime? fechaInicio,
        [FromQuery] DateTime? fechaFin)
    {
        var query = _context.Auditorias.AsQueryable();

        if (!string.IsNullOrEmpty(usuarioEmail))
        {
            var userEmailLower = usuarioEmail.ToLower();
            query = query.Where(a => a.UsuarioEmail != null && a.UsuarioEmail.ToLower().Contains(userEmailLower));
        }

        if (!string.IsNullOrEmpty(accion))
        {
            var accionLower = accion.ToLower();
            query = query.Where(a => a.Accion.ToLower().Contains(accionLower));
        }

        if (!string.IsNullOrEmpty(entidad))
        {
            var entidadLower = entidad.ToLower();
            query = query.Where(a => a.Entidad.ToLower().Contains(entidadLower));
        }

        if (fechaInicio.HasValue)
        {
            var inicio = fechaInicio.Value.Date;
            query = query.Where(a => a.Fecha >= inicio);
        }

        if (fechaFin.HasValue)
        {
            var fin = fechaFin.Value.Date.AddDays(1).AddTicks(-1);
            query = query.Where(a => a.Fecha <= fin);
        }

        var auditorias = await query
            .OrderByDescending(a => a.Fecha)
            .Take(200) // Límite de seguridad
            .ToListAsync();

        return Ok(Response<List<Auditoria>>.Ok(auditorias, "Auditorías recuperadas con éxito."));
    }
}
