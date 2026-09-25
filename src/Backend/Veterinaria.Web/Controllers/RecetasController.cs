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
public class RecetasController : ControllerBase
{
    private readonly IRecetaService _recetaService;

    public RecetasController(IRecetaService recetaService)
    {
        _recetaService = recetaService;
    }

    [HttpGet("historial/{historialId}")]
    public async Task<ActionResult<Response<object>>> GetByHistorialId(int historialId)
    {
        var receta = await _recetaService.GetRecetaByHistorialIdAsync(historialId);
        return Ok(Response<object>.Ok(receta));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Response<object>>> GetById(int id)
    {
        var receta = await _recetaService.GetRecetaByIdAsync(id);
        if (receta == null) return NotFound(Response<object>.Fail("Receta no encontrada."));
        return Ok(Response<object>.Ok(receta));
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Veterinario")]
    public async Task<ActionResult<Response<object>>> Create([FromBody] Receta receta)
    {
        if (!ModelState.IsValid) return BadRequest(Response<object>.Fail("Datos inválidos."));

        var creada = await _recetaService.CrearRecetaAsync(receta);
        return Ok(Response<object>.Ok(creada, "Receta digital emitida exitosamente."));
    }

    [HttpPost("verificar-stock")]
    public async Task<ActionResult<Response<object>>> VerificarStock([FromBody] List<int> productoIds)
    {
        var stockMap = await _recetaService.ObtenerStockDisponibleProductosAsync(productoIds);
        return Ok(Response<object>.Ok(stockMap));
    }
}
