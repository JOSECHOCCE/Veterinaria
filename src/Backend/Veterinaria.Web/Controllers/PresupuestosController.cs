using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Veterinaria.Application.DTOs;
using Veterinaria.Application.Interfaces;
using Veterinaria.Domain.Entities;

namespace Veterinaria.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PresupuestosController : ControllerBase
{
    private readonly IPresupuestoService _presupuestoService;

    public PresupuestosController(IPresupuestoService presupuestoService)
    {
        _presupuestoService = presupuestoService;
    }

    [HttpGet("cita/{citaId}")]
    public async Task<ActionResult<Response<object>>> GetByCita(int citaId)
    {
        var presupuestos = await _presupuestoService.GetPresupuestosByCitaIdAsync(citaId);
        return Ok(Response<object>.Ok(presupuestos));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Response<object>>> GetById(int id)
    {
        var presupuesto = await _presupuestoService.GetPresupuestoByIdAsync(id);
        if (presupuesto == null) return NotFound(Response<object>.Fail("Presupuesto no encontrado."));
        return Ok(Response<object>.Ok(presupuesto));
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Veterinario")]
    public async Task<ActionResult<Response<object>>> Create([FromBody] Presupuesto presupuesto)
    {
        if (!ModelState.IsValid) return BadRequest(Response<object>.Fail("Datos inválidos."));

        var creado = await _presupuestoService.CrearPresupuestoAsync(presupuesto);
        return Ok(Response<object>.Ok(creado, "Presupuesto médico creado exitosamente."));
    }

    [HttpPut("{id}/responder")]
    public async Task<ActionResult<Response<object>>> Responder(int id, [FromBody] ResponderPresupuestoDto dto)
    {
        var (success, presupuesto, error) = await _presupuestoService.ResponderPresupuestoAsync(id, dto.Aceptado);
        if (!success) return BadRequest(Response<object>.Fail(error ?? "Error al responder presupuesto."));

        return Ok(Response<object>.Ok(presupuesto, $"Presupuesto {(dto.Aceptado ? "aceptado" : "rechazado")} exitosamente."));
    }
}

public class ResponderPresupuestoDto
{
    public bool Aceptado { get; set; }
}
