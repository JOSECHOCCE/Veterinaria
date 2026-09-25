using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Veterinaria.Application.DTOs;
using Veterinaria.Application.Interfaces;
using Veterinaria.Domain.Entities;

namespace Veterinaria.Web.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class SeguridadController : ControllerBase
{
    private readonly IAnonymizationService _anonymizationService;
    private readonly IAuditoriaService _auditoriaService;

    public SeguridadController(IAnonymizationService anonymizationService, IAuditoriaService auditoriaService)
    {
        _anonymizationService = anonymizationService;
        _auditoriaService = auditoriaService;
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("anonimizar-cliente/{id}")]
    public async Task<ActionResult<Response<Usuario>>> AnonimizarCliente(int id)
    {
        try
        {
            var currentUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            int ejecutadoPorUserId = int.TryParse(currentUserIdClaim, out int uid) ? uid : 1;
            string? ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();

            var result = await _anonymizationService.AnonimizarClienteAsync(id, ejecutadoPorUserId, ipAddress);
            return Ok(Response<Usuario>.Ok(result, "Cliente anonimizado exitosamente."));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(Response<Usuario>.Fail(ex.Message));
        }
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("auditoria")]
    public async Task<ActionResult<Response<IEnumerable<AuditoriaLog>>>> GetAuditoriaLogs([FromQuery] DateTime? fechaInicio, [FromQuery] DateTime? fechaFin)
    {
        var logs = await _auditoriaService.ObtenerLogsAuditoriaAsync(fechaInicio, fechaFin);
        return Ok(Response<IEnumerable<AuditoriaLog>>.Ok(logs));
    }
}
