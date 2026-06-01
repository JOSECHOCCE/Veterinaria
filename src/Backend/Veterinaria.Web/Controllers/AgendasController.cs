using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Veterinaria.Application.DTOs;
using Veterinaria.Application.Interfaces;
using System.Threading.Tasks;
using System;

namespace Veterinaria.Web.Controllers;

[Authorize(Roles = "Admin,Recepcionista")]
[ApiController]
[Route("api/[controller]")]
public class AgendasController : ControllerBase
{
    private readonly IAgendaService _agendaService;

    public AgendasController(IAgendaService agendaService)
    {
        _agendaService = agendaService;
    }

    [HttpGet("HorarioClinica")]
    public async Task<IActionResult> GetHorariosClinica()
    {
        var horarios = await _agendaService.GetHorariosClinicaAsync();
        return Ok(Response<object>.Ok(horarios));
    }

    [HttpPut("HorarioClinica")]
    public async Task<IActionResult> UpdateHorarioClinica([FromBody] ActualizarHorarioClinicaDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var res = await _agendaService.ActualizarHorarioClinicaAsync(dto, userId ?? "");
        return res.Success ? Ok(res) : BadRequest(res);
    }

    [HttpGet("HorarioVeterinario/{vetId}")]
    public async Task<IActionResult> GetHorariosVet(int vetId)
    {
        var horarios = await _agendaService.GetHorariosVeterinarioAsync(vetId);
        return Ok(Response<object>.Ok(horarios));
    }

    [HttpPut("HorarioVeterinario")]
    public async Task<IActionResult> UpdateHorarioVet([FromBody] ActualizarHorarioVeterinarioDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var res = await _agendaService.ActualizarHorarioVeterinarioAsync(dto, userId ?? "");
        return res.Success ? Ok(res) : BadRequest(res);
    }

    [HttpGet("Bloqueos/{vetId}")]
    public async Task<IActionResult> GetBloqueos(int vetId, [FromQuery] DateTime desde, [FromQuery] DateTime hasta)
    {
        var bloqueos = await _agendaService.GetBloqueosAsync(vetId, desde, hasta);
        return Ok(Response<object>.Ok(bloqueos));
    }

    [HttpPost("Bloqueos")]
    public async Task<IActionResult> CreateBloqueo([FromBody] CrearBloqueoAgendaDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var res = await _agendaService.CrearBloqueoAsync(dto, userId ?? "");
        return res.Success ? Ok(res) : BadRequest(res);
    }

    [HttpDelete("Bloqueos/{id}")]
    public async Task<IActionResult> DeleteBloqueo(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var res = await _agendaService.EliminarBloqueoAsync(id, userId ?? "");
        return res.Success ? Ok(res) : BadRequest(res);
    }
}
