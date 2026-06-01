using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Veterinaria.Application.DTOs;
using Veterinaria.Application.Interfaces;
using Veterinaria.Domain.Entities;
using Veterinaria.Web.Models.Dto;

namespace Veterinaria.Web.Controllers;

[Authorize(Roles = "Admin,Veterinario,Recepcionista,Cliente,Usuario")]
[ApiController]
[Route("api/[controller]")]
public class HistorialesClinicosController : ControllerBase
{
    private readonly IHistorialClinicoService _historialService;
    private readonly IMapper _mapper;

    public HistorialesClinicosController(IHistorialClinicoService historialService, IMapper mapper)
    {
        _historialService = historialService;
        _mapper = mapper;
    }

    private string? GetUserEmail() => User.FindFirst(ClaimTypes.Email)?.Value;
    private bool IsAdmin() => User.IsInRole("Admin");

    [HttpGet]
    public async Task<ActionResult<Response<object>>> Index([FromQuery] int mascotaId, [FromQuery] int page = 1)
    {
        var mascota = await _historialService.GetMascotaWithUsuarioAsync(mascotaId);
        if (mascota == null) return NotFound(Response<object>.Fail("Mascota no encontrada."));

        var historiales = await _historialService.GetHistorialesByMascotaIdAsync(mascotaId);
        var historialesDto = _mapper.Map<List<HistorialClinicoDto>>(historiales);

        for (int i = 0; i < historiales.Count; i++)
        {
            historialesDto[i].VeterinarioNombre = historiales[i].Cita.Veterinario?.Nombre;
            historialesDto[i].ServicioNombre = historiales[i].Cita.Servicio?.Nombre;
            historialesDto[i].FechaCita = historiales[i].Cita.FechaHora;
        }

        int pageSize = 10;
        var paginatedList = historialesDto.Skip((page - 1) * pageSize).Take(pageSize).ToList();

        var result = new
        {
            Mascota = mascota,
            MascotaId = mascotaId,
            Historiales = paginatedList,
            TotalItems = historialesDto.Count,
            Page = page,
            PageSize = pageSize
        };

        return Ok(Response<object>.Ok(result));
    }

    [HttpGet("details/{citaId}")]
    public async Task<ActionResult<Response<object>>> Details(int citaId)
    {
        var historial = await _historialService.GetHistorialByCitaIdAsync(citaId);
        if (historial == null) return NotFound(Response<object>.Fail("Historial clínico no encontrado para esta cita."));

        var historialDto = _mapper.Map<HistorialClinicoDto>(historial);
        historialDto.VeterinarioNombre = historial.Cita.Veterinario?.Nombre;
        historialDto.ServicioNombre = historial.Cita.Servicio?.Nombre;
        historialDto.FechaCita = historial.Cita.FechaHora;
        historialDto.MotivoCita = historial.Cita.Motivo;

        var result = new
        {
            HistorialDto = historialDto,
            Mascota = historial.Cita.Mascota,
            Veterinario = historial.Cita.Veterinario,
            Servicio = historial.Cita.Servicio,
            Cita = historial.Cita
        };

        return Ok(Response<object>.Ok(result));
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Admin,Veterinario")]
    public async Task<ActionResult<Response<object>>> GetById(int id)
    {
        var historial = await _historialService.GetHistorialByIdAsync(id);
        if (historial == null) return NotFound(Response<object>.Fail("Historial clínico no encontrado."));

        var historialDto = _mapper.Map<HistorialClinicoDto>(historial);
        var result = new
        {
            HistorialDto = historialDto,
            Cita = historial.Cita
        };

        return Ok(Response<object>.Ok(result));
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Veterinario")]
    public async Task<ActionResult<Response<object>>> Create([FromBody] HistorialClinicoDto historialDto)
    {
        if (!ModelState.IsValid) return BadRequest(Response<object>.Fail("Datos inválidos."));

        var historial = _mapper.Map<HistorialClinico>(historialDto);
        var (success, guardado, error) = await _historialService.GuardarBorradorAsync(historial, GetUserEmail(), IsAdmin());

        if (!success) return BadRequest(Response<object>.Fail(error ?? "Error al guardar borrador."));

        return Ok(Response<object>.Ok(guardado?.CitaId, "Atención guardada exitosamente."));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Veterinario")]
    public async Task<ActionResult<Response<object>>> Edit(int id, [FromBody] HistorialClinicoDto historialDto)
    {
        if (id != historialDto.Id) return BadRequest(Response<object>.Fail("ID mismatch."));
        if (!ModelState.IsValid) return BadRequest(Response<object>.Fail("Datos inválidos."));

        var historial = _mapper.Map<HistorialClinico>(historialDto);
        var (success, actualizado, error) = await _historialService.ActualizarBorradorAsync(historial, GetUserEmail(), IsAdmin());

        if (!success) return BadRequest(Response<object>.Fail(error ?? "Error al actualizar borrador."));

        return Ok(Response<object>.Ok(actualizado?.CitaId, "Atención actualizada exitosamente."));
    }

    [HttpPost("Cerrar/{citaId}")]
    [Authorize(Roles = "Admin,Veterinario")]
    public async Task<ActionResult<Response<object>>> CerrarAtencion(int citaId)
    {
        var (success, error) = await _historialService.CerrarAtencionAsync(citaId, GetUserEmail(), IsAdmin());

        if (!success) return BadRequest(Response<object>.Fail(error ?? "Error al cerrar la atención."));

        return Ok(Response<object>.Ok(citaId, "Atención clínica cerrada. La cita pasó a estado Completada."));
    }

    [HttpGet("descargarpdf/{citaId}")]
    public async Task<ActionResult<Response<object>>> DescargarPDF(int citaId)
    {
        var historial = await _historialService.GetHistorialByCitaIdAsync(citaId);
        if (historial == null) return NotFound(Response<object>.Fail("Historial clínico no encontrado."));

        return Ok(Response<object>.Ok("La funcionalidad de descarga de PDF será implementada próximamente."));
    }
}
