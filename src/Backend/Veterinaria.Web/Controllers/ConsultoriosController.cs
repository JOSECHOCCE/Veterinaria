using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Veterinaria.Application.DTOs;
using Veterinaria.Application.Interfaces;
using Veterinaria.Web.Models.Dto;

namespace Veterinaria.Web.Controllers;

[Authorize(Roles = "Admin,Recepcionista,Veterinario")]
[ApiController]
[Route("api/[controller]")]
public class ConsultoriosController : ControllerBase
{
    private readonly IConsultorioService _consultorioService;

    public ConsultoriosController(IConsultorioService consultorioService)
    {
        _consultorioService = consultorioService;
    }

    [HttpGet]
    public async Task<ActionResult<Response<IEnumerable<ConsultorioDto>>>> Index(bool incluirInactivos = false)
    {
        var result = await _consultorioService.GetConsultoriosAsync(incluirInactivos);
        return Ok(Response<IEnumerable<ConsultorioDto>>.Ok(result));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Response<ConsultorioDto>>> Details(int id)
    {
        var item = await _consultorioService.GetConsultorioByIdAsync(id);
        if (item == null)
        {
            return NotFound(Response<object>.Fail("Espacio físico no encontrado."));
        }
        return Ok(Response<ConsultorioDto>.Ok(item));
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Response<ConsultorioDto>>> Create([FromBody] CrearConsultorioDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(Response<object>.Fail("Datos de espacio físico inválidos."));
        }

        var created = await _consultorioService.CrearConsultorioAsync(dto);
        return Ok(Response<ConsultorioDto>.Ok(created, "Espacio físico creado exitosamente."));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Response<object>>> Edit(int id, [FromBody] CrearConsultorioDto dto)
    {
        var success = await _consultorioService.ActualizarConsultorioAsync(id, dto);
        if (!success)
        {
            return NotFound(Response<object>.Fail("Espacio físico no encontrado."));
        }

        return Ok(Response<object>.Ok(new { Message = "Espacio físico actualizado exitosamente." }));
    }

    [HttpPost("ToggleActivo/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Response<object>>> ToggleActivo(int id)
    {
        var success = await _consultorioService.ToggleActivoAsync(id);
        if (!success)
        {
            return NotFound(Response<object>.Fail("Espacio físico no encontrado."));
        }

        return Ok(Response<object>.Ok(new { Message = "Estado del espacio físico cambiado exitosamente." }));
    }

    [HttpGet("ocupacion")]
    public async Task<ActionResult<Response<IEnumerable<OcupacionConsultorioDto>>>> Ocupacion([FromQuery] DateTime? fecha)
    {
        var targetDate = fecha ?? DateTime.Today;
        var result = await _consultorioService.GetOcupacionRealTimeAsync(targetDate);
        return Ok(Response<IEnumerable<OcupacionConsultorioDto>>.Ok(result));
    }
}
