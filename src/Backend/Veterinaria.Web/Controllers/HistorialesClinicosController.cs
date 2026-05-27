using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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

    [HttpGet]
    public async Task<ActionResult<Response<object>>> Index([FromQuery] int mascotaId, [FromQuery] int page = 1)
    {
        var mascota = await _historialService.GetMascotaWithUsuarioAsync(mascotaId);

        if (mascota == null)
        {
            return NotFound(Response<object>.Fail("Mascota no encontrada."));
        }

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

    [HttpGet("create/{citaId}")]
    [Authorize(Roles = "Admin,Veterinario")]
    public async Task<ActionResult<Response<object>>> CreateGet(int citaId)
    {
        var cita = await _historialService.GetCitaForHistorialAsync(citaId);

        if (cita == null)
        {
            return NotFound(Response<object>.Fail("Cita no encontrada."));
        }

        if (cita.Estado != "Completada")
        {
            return BadRequest(Response<object>.Fail("Solo se puede crear historial clínico para citas completadas."));
        }

        var historialExistente = await _historialService.ExistsHistorialForCitaAsync(citaId);

        if (historialExistente)
        {
            return BadRequest(Response<object>.Fail("Ya existe un historial clínico para esta cita."));
        }

        var historialDto = new HistorialClinicoDto
        {
            CitaId = citaId,
            FechaRegistro = DateTime.Now
        };

        var result = new
        {
            HistorialDto = historialDto,
            Cita = cita
        };

        return Ok(Response<object>.Ok(result));
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Veterinario")]
    public async Task<ActionResult<Response<object>>> Create([FromBody] HistorialClinicoDto historialDto)
    {
        var cita = await _historialService.GetCitaForHistorialAsync(historialDto.CitaId);

        if (cita == null)
        {
            return NotFound(Response<object>.Fail("Cita no encontrada."));
        }

        if (cita.Estado != "Completada")
        {
            return BadRequest(Response<object>.Fail("Solo se puede crear historial clínico para citas completadas."));
        }

        var historialExistente = await _historialService.ExistsHistorialForCitaAsync(historialDto.CitaId);

        if (historialExistente)
        {
            return BadRequest(Response<object>.Fail("Ya existe un historial clínico para esta cita."));
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(Response<object>.Fail("Model state is invalid."));
        }

        var historial = _mapper.Map<HistorialClinico>(historialDto);
        historial.FechaRegistro = DateTime.Now;

        await _historialService.AddHistorialAsync(historial);

        return Ok(Response<object>.Ok(historial.CitaId, "Historial clínico creado exitosamente."));
    }

    [HttpGet("details/{citaId}")]
    public async Task<ActionResult<Response<object>>> Details(int citaId)
    {
        var historial = await _historialService.GetHistorialByCitaIdAsync(citaId);

        if (historial == null)
        {
            return NotFound(Response<object>.Fail("Historial clínico no encontrado para esta cita."));
        }

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
    public async Task<ActionResult<Response<object>>> EditGet(int id)
    {
        var historial = await _historialService.GetHistorialByIdAsync(id);

        if (historial == null)
        {
            return NotFound(Response<object>.Fail("Historial clínico no encontrado."));
        }

        var historialDto = _mapper.Map<HistorialClinicoDto>(historial);
        var result = new
        {
            HistorialDto = historialDto,
            Cita = historial.Cita
        };

        return Ok(Response<object>.Ok(result));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Veterinario")]
    public async Task<ActionResult<Response<object>>> Edit(int id, [FromBody] HistorialClinicoDto historialDto)
    {
        if (id != historialDto.Id)
        {
            return BadRequest(Response<object>.Fail("ID mismatch."));
        }

        var historialExistente = await _historialService.GetHistorialByIdAsync(id);

        if (historialExistente == null)
        {
            return NotFound(Response<object>.Fail("Historial clínico no encontrado."));
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(Response<object>.Fail("Model state is invalid."));
        }

        historialExistente.Diagnostico = historialDto.Diagnostico;
        historialExistente.Tratamiento = historialDto.Tratamiento;
        historialExistente.Medicamentos = historialDto.Medicamentos;
        historialExistente.Observaciones = historialDto.Observaciones;

        await _historialService.UpdateHistorialAsync(historialExistente);

        return Ok(Response<object>.Ok(historialExistente.CitaId, "Historial clínico actualizado exitosamente."));
    }

    [HttpGet("descargarpdf/{citaId}")]
    public async Task<ActionResult<Response<object>>> DescargarPDF(int citaId)
    {
        var historial = await _historialService.GetHistorialByCitaIdAsync(citaId);

        if (historial == null)
        {
            return NotFound(Response<object>.Fail("Historial clínico no encontrado."));
        }

        return Ok(Response<object>.Ok("La funcionalidad de descarga de PDF será implementada próximamente."));
    }
}
