using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Veterinaria.Application.DTOs;
using Veterinaria.Application.Interfaces;
using Veterinaria.Domain.Entities;
using System;
using System.Threading.Tasks;

namespace Veterinaria.Web.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ConsentimientosController : ControllerBase
{
    private readonly IConsentimientoService _consentimientoService;

    public ConsentimientosController(IConsentimientoService consentimientoService)
    {
        _consentimientoService = consentimientoService;
    }

    // GET: api/Consentimientos
    [Authorize(Roles = "Admin")]
    [HttpGet]
    public async Task<ActionResult<Response<object>>> Index(int? usuarioId)
    {
        var consentimientos = await _consentimientoService.GetConsentimientosAsync(usuarioId);

        return Ok(Response<object>.Ok(consentimientos));
    }

    // GET: api/Consentimientos/CreateTemplate
    [HttpGet("CreateTemplate")]
    public ActionResult<Response<object>> Create(int? mascotaId, string? tipo)
    {
        var consentimiento = new Consentimiento
        {
            DocumentoId = $"FRM-{DateTime.Now:yyyy}-{new Random().Next(100, 999)}",
            TipoConsentimiento = tipo ?? "Anestesia General y Cirugía"
        };

        if (mascotaId.HasValue) consentimiento.MascotaId = mascotaId;

        return Ok(Response<object>.Ok(consentimiento));
    }

    // POST: api/Consentimientos
    [HttpPost]
    public async Task<ActionResult<Response<object>>> Create(Consentimiento consentimiento)
    {
        if (ModelState.IsValid)
        {
            // Get current user's Usuario record
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var usuario = await _consentimientoService.GetUsuarioByApplicationUserIdAsync(userId);

            if (usuario == null)
            {
                return BadRequest(Response<object>.Fail("Usuario no encontrado."));
            }

            consentimiento.UsuarioId = usuario.Id;
            consentimiento.IpOrigen = HttpContext.Connection.RemoteIpAddress?.ToString();
            consentimiento.FechaCreacion = DateTime.Now;

            if (consentimiento.Aceptado)
            {
                consentimiento.FechaAceptacion = DateTime.Now;
            }

            await _consentimientoService.AddConsentimientoAsync(consentimiento);

            return Ok(Response<object>.Ok(consentimiento));
        }

        return BadRequest(Response<object>.Fail("Invalid model state."));
    }

    // GET: api/Consentimientos/5
    [HttpGet("{id}")]
    public async Task<ActionResult<Response<object>>> Details(int id)
    {
        var consentimiento = await _consentimientoService.GetConsentimientoByIdAsync(id);

        if (consentimiento == null) return NotFound(Response<object>.Fail("Consentimiento no encontrado."));

        return Ok(Response<object>.Ok(consentimiento));
    }
}
