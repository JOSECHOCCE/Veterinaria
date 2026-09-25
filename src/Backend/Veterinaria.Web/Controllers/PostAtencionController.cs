using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Veterinaria.Application.DTOs;
using Veterinaria.Application.Interfaces;
using Veterinaria.Domain.Entities;
using Veterinaria.Web.Models.Dto;

namespace Veterinaria.Web.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class PostAtencionController : ControllerBase
{
    private readonly IPostAtencionService _postAtencionService;

    public PostAtencionController(IPostAtencionService postAtencionService)
    {
        _postAtencionService = postAtencionService;
    }

    [Authorize(Roles = "Admin,Recepcionista,Veterinario")]
    [HttpGet("seguimientos-pendientes")]
    public async Task<ActionResult<Response<IEnumerable<SeguimientoPostAtencion>>>> GetSeguimientosPendientes()
    {
        var result = await _postAtencionService.ObtenerSeguimientosPendientesAsync();
        return Ok(Response<IEnumerable<SeguimientoPostAtencion>>.Ok(result));
    }

    [Authorize(Roles = "Admin,Recepcionista,Veterinario")]
    [HttpPost("seguimiento/{id}/resultado")]
    public async Task<ActionResult<Response<SeguimientoPostAtencion>>> RegistrarResultado(int id, [FromBody] ResultadoSeguimientoRequest request)
    {
        try
        {
            var result = await _postAtencionService.RegistrarResultadoSeguimientoAsync(
                id,
                request.Estado,
                request.EvolucionPaciente,
                request.NotasSeguimiento,
                request.RequiereAtencionUrgente
            );
            return Ok(Response<SeguimientoPostAtencion>.Ok(result, "Resultado de seguimiento registrado exitosamente."));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(Response<SeguimientoPostAtencion>.Fail(ex.Message));
        }
    }

    [Authorize(Roles = "Admin,Recepcionista,Veterinario")]
    [HttpPost("recordatorio-vacuna")]
    public async Task<ActionResult<Response<RecordatorioVacuna>>> ProgramarRecordatorioVacuna([FromBody] RecordatorioVacuna recordatorio)
    {
        var result = await _postAtencionService.ProgramarRecordatorioVacunaAsync(recordatorio);
        return Ok(Response<RecordatorioVacuna>.Ok(result, "Recordatorio de vacuna programado exitosamente."));
    }

    [HttpGet("recordatorios")]
    public async Task<ActionResult<Response<IEnumerable<RecordatorioVacuna>>>> GetRecordatorios([FromQuery] int? clienteId)
    {
        var result = await _postAtencionService.ObtenerRecordatoriosPendientesAsync(clienteId);
        return Ok(Response<IEnumerable<RecordatorioVacuna>>.Ok(result));
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("procesar-recordatorios-diarios")]
    public async Task<ActionResult<Response<object>>> ProcesarRecordatoriosDiarios()
    {
        int notificados = await _postAtencionService.ProcesarNotificacionesRecordatoriosDiariosAsync();
        return Ok(Response<object>.Ok(new { Notificados = notificados }, $"{notificados} recordatorios de vacunas notificados."));
    }
}

public class ResultadoSeguimientoRequest
{
    public string Estado { get; set; } = "Contactado";
    public string? EvolucionPaciente { get; set; }
    public string? NotasSeguimiento { get; set; }
    public bool RequiereAtencionUrgente { get; set; } = false;
}
