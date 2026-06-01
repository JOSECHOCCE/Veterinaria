using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Veterinaria.Application.Interfaces;
using Veterinaria.Web.Models.Dto;
using Veterinaria.Application.DTOs;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace Veterinaria.Web.Controllers;

[Authorize(Roles = "Admin,Recepcionista,Veterinario,Cliente,Usuario")]
[ApiController]
[Route("api/[controller]")]
public class MascotasController : ControllerBase
{
    private readonly IMascotaService _mascotaService;
    private readonly IMapper _mapper;

    public MascotasController(IMascotaService mascotaService, IMapper mapper)
    {
        _mascotaService = mascotaService;
        _mapper = mapper;
    }

    [HttpGet]
    public async Task<ActionResult<Response<object>>> Index([FromQuery] string? q, [FromQuery] int page = 1)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
        var isCliente = User.IsInRole("Cliente") || User.IsInRole("Usuario");

        var result = await _mascotaService.GetMascotasPaginatedAsync(q, page, userId, isCliente);

        var mascotasDto = _mapper.Map<List<MascotaDto>>(result.Mascotas);

        return Ok(Response<object>.Ok(new { Data = mascotasDto, Total = result.Total, Page = page, PageSize = 10, CurrentFilter = q }));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Response<object>>> Details(int id)
    {
        var mascota = await _mascotaService.GetMascotaWithDetailsAsync(id);

        if (mascota == null)
        {
            return NotFound(Response<object>.Fail("Mascota no encontrada."));
        }

        var mascotaDto = _mapper.Map<MascotaDto>(mascota);
        
        var citas = mascota.Citas.OrderByDescending(c => c.FechaHora).ToList();
        var citasDto = _mapper.Map<List<CitaDto>>(citas);

        var historiales = mascota.Citas
            .Where(c => c.Historial != null)
            .OrderByDescending(c => c.FechaHora)
            .Select(c => {
                var h = c.Historial!;
                h.Cita = c;
                return h;
            })
            .ToList();
        var historialesDto = _mapper.Map<List<HistorialClinicoDto>>(historiales);

        var alertas = await _mascotaService.GetAlertasMascotaAsync(id);

        return Ok(Response<object>.Ok(new { 
            Mascota = mascotaDto, 
            Citas = citasDto, 
            Historiales = historialesDto,
            Alertas = alertas
        }));
    }

    [HttpGet("Create")]
    public async Task<ActionResult<Response<object>>> Create()
    {
        var usuarios = await _mascotaService.GetActiveUsuariosAsync();
        return Ok(Response<object>.Ok(new { Usuarios = usuarios }));
    }

    [HttpPost]
    public async Task<ActionResult<Response<object>>> Create([FromBody] CrearMascotaDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(Response<object>.Fail("Datos inválidos para la mascota."));
        }

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
        var isAdmin = User.IsInRole("Admin");

        var result = await _mascotaService.CrearMascotaAsync(dto, userId, isAdmin);

        if (result.Success && result.Data != null)
        {
            var resultDto = _mapper.Map<MascotaDto>(result.Data);
            return Ok(Response<object>.Ok(resultDto, result.Message));
        }

        return BadRequest(Response<object>.Fail(result.Message));
    }

    [HttpGet("Edit/{id}")]
    public async Task<ActionResult<Response<object>>> EditGet(int id)
    {
        var mascota = await _mascotaService.GetMascotaByIdAsync(id);
        if (mascota == null)
        {
            return NotFound(Response<object>.Fail("Mascota no encontrada."));
        }

        var mascotaDto = _mapper.Map<MascotaDto>(mascota);
        var usuarios = await _mascotaService.GetActiveUsuariosAsync();
        
        return Ok(Response<object>.Ok(new { Mascota = mascotaDto, Usuarios = usuarios }));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Response<object>>> Edit(int id, [FromBody] EditarMascotaDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(Response<object>.Fail("Datos inválidos."));
        }

        var result = await _mascotaService.EditarMascotaAsync(id, dto);

        if (result.Success)
        {
            return Ok(Response<object>.Ok(new { Message = result.Message }));
        }

        return BadRequest(Response<object>.Fail(result.Message));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<Response<object>>> DeleteConfirmed(int id)
    {
        var result = await _mascotaService.DeleteMascotaAsync(id);

        if (result.Success)
        {
            return Ok(Response<object>.Ok(new { Message = result.Message }));
        }

        return NotFound(Response<object>.Fail(result.Message));
    }
}
