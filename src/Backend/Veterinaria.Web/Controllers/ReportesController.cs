using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Veterinaria.Application.DTOs;
using Veterinaria.Application.Interfaces;

namespace Veterinaria.Web.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ReportesController : ControllerBase
{
    private readonly IReporteService _reporteService;

    public ReportesController(IReporteService reporteService)
    {
        _reporteService = reporteService;
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("ingresos-categorizados")]
    public async Task<ActionResult<Response<ReporteIngresosCategorizadoDto>>> GetIngresosCategorizados([FromQuery] DateTime fechaInicio, [FromQuery] DateTime fechaFin)
    {
        if (fechaInicio == default)
        {
            fechaInicio = DateTime.UtcNow.Date.AddDays(-30);
        }

        if (fechaFin == default)
        {
            fechaFin = DateTime.UtcNow;
        }

        var result = await _reporteService.ObtenerIngresosCategorizadosAsync(fechaInicio, fechaFin);
        return Ok(Response<ReporteIngresosCategorizadoDto>.Ok(result, "Reporte de ingresos categorizados generado exitosamente."));
    }
}
