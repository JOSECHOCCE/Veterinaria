using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Veterinaria.Application.DTOs;
using Veterinaria.Application.Interfaces;
using Veterinaria.Domain.Contracts;
using Veterinaria.Domain.Entities;

namespace Veterinaria.Web.Controllers;

[Authorize(Roles = "Cliente,Usuario")]
[ApiController]
[Route("api/[controller]")]
public class PortalClienteController : ControllerBase
{
    private readonly IPortalClienteService _portalClienteService;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IUnitOfWork _unitOfWork;

    public PortalClienteController(
        IPortalClienteService portalClienteService,
        UserManager<ApplicationUser> userManager,
        IUnitOfWork unitOfWork)
    {
        _portalClienteService = portalClienteService;
        _userManager = userManager;
        _unitOfWork = unitOfWork;
    }

    private async Task<int?> GetCurrentUsuarioIdAsync()
    {
        var appUser = await _userManager.GetUserAsync(User);
        if (appUser == null) return null;

        var usuario = await _unitOfWork.Usuarios.GetAll()
            .FirstOrDefaultAsync(u => u.ApplicationUserId == appUser.Id);

        return usuario?.Id;
    }

    [HttpGet("Dashboard")]
    public async Task<ActionResult<Response<PortalDashboardDto>>> GetDashboard()
    {
        var usuarioId = await GetCurrentUsuarioIdAsync();
        if (usuarioId == null) return Unauthorized(Response<PortalDashboardDto>.Fail("No autorizado"));

        var result = await _portalClienteService.GetDashboardAsync(usuarioId.Value);
        return Ok(result);
    }

    [HttpGet("Mascotas")]
    public async Task<ActionResult<Response<object>>> GetMisMascotas()
    {
        var usuarioId = await GetCurrentUsuarioIdAsync();
        if (usuarioId == null) return Unauthorized(Response<object>.Fail("No autorizado"));

        var result = await _portalClienteService.GetMisMascotasAsync(usuarioId.Value);
        return Ok(result);
    }

    [HttpPost("Mascotas")]
    public async Task<ActionResult<Response<object>>> RegistrarMascota([FromBody] RegistrarMascotaPortalDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(Response<object>.Fail("Datos inválidos"));

        var usuarioId = await GetCurrentUsuarioIdAsync();
        if (usuarioId == null) return Unauthorized(Response<object>.Fail("No autorizado"));

        var result = await _portalClienteService.RegistrarMascotaAsync(usuarioId.Value, dto);
        return Ok(result);
    }

    [HttpGet("Mascotas/{mascotaId}/Historial")]
    public async Task<ActionResult<Response<object>>> GetHistorialMascota(int mascotaId)
    {
        var usuarioId = await GetCurrentUsuarioIdAsync();
        if (usuarioId == null) return Unauthorized(Response<object>.Fail("No autorizado"));

        var result = await _portalClienteService.GetHistorialMascotaAsync(usuarioId.Value, mascotaId);
        if (!result.Success) return BadRequest(result);

        return Ok(result);
    }

    [HttpGet("Citas")]
    public async Task<ActionResult<Response<object>>> GetMisCitas()
    {
        var usuarioId = await GetCurrentUsuarioIdAsync();
        if (usuarioId == null) return Unauthorized(Response<object>.Fail("No autorizado"));

        var result = await _portalClienteService.GetMisCitasAsync(usuarioId.Value);
        return Ok(result);
    }

    [HttpPost("Citas")]
    public async Task<ActionResult<Response<object>>> SolicitarCita([FromBody] SolicitarCitaPortalDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(Response<object>.Fail("Datos inválidos"));

        var usuarioId = await GetCurrentUsuarioIdAsync();
        if (usuarioId == null) return Unauthorized(Response<object>.Fail("No autorizado"));

        var result = await _portalClienteService.SolicitarCitaAsync(usuarioId.Value, dto);
        if (!result.Success) return BadRequest(result);

        return Ok(result);
    }

    [HttpPut("Citas/{citaId}/Cancelar")]
    public async Task<ActionResult<Response<object>>> CancelarCita(int citaId)
    {
        var usuarioId = await GetCurrentUsuarioIdAsync();
        if (usuarioId == null) return Unauthorized(Response<object>.Fail("No autorizado"));

        var result = await _portalClienteService.CancelarCitaAsync(usuarioId.Value, citaId);
        if (!result.Success) return BadRequest(result);

        return Ok(result);
    }

    [HttpGet("Pagos")]
    public async Task<ActionResult<Response<object>>> GetMisPagos()
    {
        var usuarioId = await GetCurrentUsuarioIdAsync();
        if (usuarioId == null) return Unauthorized(Response<object>.Fail("No autorizado"));

        var result = await _portalClienteService.GetMisPagosAsync(usuarioId.Value);
        return Ok(result);
    }

    [HttpGet("Perfil")]
    public async Task<ActionResult<Response<object>>> GetMiPerfil()
    {
        var usuarioId = await GetCurrentUsuarioIdAsync();
        if (usuarioId == null) return Unauthorized(Response<object>.Fail("No autorizado"));

        var result = await _portalClienteService.GetMiPerfilAsync(usuarioId.Value);
        if (!result.Success) return BadRequest(result);

        return Ok(result);
    }

    [HttpPut("Perfil")]
    public async Task<ActionResult<Response<object>>> ActualizarPerfil([FromBody] ActualizarPerfilPortalDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(Response<object>.Fail("Datos inválidos"));

        var usuarioId = await GetCurrentUsuarioIdAsync();
        if (usuarioId == null) return Unauthorized(Response<object>.Fail("No autorizado"));

        var result = await _portalClienteService.ActualizarPerfilAsync(usuarioId.Value, dto);
        if (!result.Success) return BadRequest(result);

        return Ok(result);
    }
}
