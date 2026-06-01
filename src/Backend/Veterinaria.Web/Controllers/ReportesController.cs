using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Veterinaria.Application.DTOs;
using Veterinaria.Application.Interfaces;
using Veterinaria.Web.Services;

namespace Veterinaria.Web.Controllers;

[Authorize(Roles = "Admin,Recepcionista")]
[ApiController]
[Route("api/[controller]")]
public class ReportesController : ControllerBase
{
    private readonly IReporteService _reporteService;
    private readonly PdfService _pdfService;

    public ReportesController(IReporteService reporteService, PdfService pdfService)
    {
        _reporteService = reporteService;
        _pdfService = pdfService;
    }

    [HttpGet("Citas")]
    public async Task<ActionResult<Response<ReporteCitasDto>>> GetReporteCitas(
        [FromQuery] DateTime fechaInicio,
        [FromQuery] DateTime fechaFin,
        [FromQuery] string? estado = null,
        [FromQuery] int? veterinarioId = null)
    {
        var result = await _reporteService.GetReporteCitasAsync(fechaInicio, fechaFin, estado, veterinarioId);
        return Ok(result);
    }

    [HttpGet("Citas/Exportar")]
    public async Task<IActionResult> ExportarReporteCitas(
        [FromQuery] DateTime fechaInicio,
        [FromQuery] DateTime fechaFin,
        [FromQuery] string formato = "csv",
        [FromQuery] string? estado = null,
        [FromQuery] int? veterinarioId = null)
    {
        if (formato.ToLower() == "pdf")
        {
            var result = await _reporteService.GetReporteCitasAsync(fechaInicio, fechaFin, estado, veterinarioId);
            if (!result.Success || result.Data == null)
                return BadRequest("No se pudo generar el reporte.");

            var pdfBytes = _pdfService.GenerarReporteCitasPdf(result.Data);
            return File(pdfBytes, "application/pdf", $"ReporteCitas_{DateTime.Now:yyyyMMddHHmmss}.pdf");
        }
        else
        {
            var csvBytes = await _reporteService.ExportarReporteCitasCsvAsync(fechaInicio, fechaFin, estado, veterinarioId);
            return File(csvBytes, "text/csv", $"ReporteCitas_{DateTime.Now:yyyyMMddHHmmss}.csv");
        }
    }

    [HttpGet("Ingresos")]
    public async Task<ActionResult<Response<ReporteIngresosDto>>> GetReporteIngresos(
        [FromQuery] DateTime fechaInicio,
        [FromQuery] DateTime fechaFin,
        [FromQuery] string? metodoPago = null)
    {
        var result = await _reporteService.GetReporteIngresosAsync(fechaInicio, fechaFin, metodoPago);
        return Ok(result);
    }

    [HttpGet("Ingresos/Exportar")]
    public async Task<IActionResult> ExportarReporteIngresos(
        [FromQuery] DateTime fechaInicio,
        [FromQuery] DateTime fechaFin,
        [FromQuery] string formato = "csv",
        [FromQuery] string? metodoPago = null)
    {
        if (formato.ToLower() == "pdf")
        {
            var result = await _reporteService.GetReporteIngresosAsync(fechaInicio, fechaFin, metodoPago);
            if (!result.Success || result.Data == null)
                return BadRequest("No se pudo generar el reporte.");

            var pdfBytes = _pdfService.GenerarReporteIngresosPdf(result.Data);
            return File(pdfBytes, "application/pdf", $"ReporteIngresos_{DateTime.Now:yyyyMMddHHmmss}.pdf");
        }
        else
        {
            var csvBytes = await _reporteService.ExportarReporteIngresosCsvAsync(fechaInicio, fechaFin, metodoPago);
            return File(csvBytes, "text/csv", $"ReporteIngresos_{DateTime.Now:yyyyMMddHHmmss}.csv");
        }
    }

    [HttpGet("NuevosClientes")]
    public async Task<ActionResult<Response<ReporteNuevosClientesDto>>> GetReporteNuevosClientes(
        [FromQuery] DateTime fechaInicio,
        [FromQuery] DateTime fechaFin)
    {
        var result = await _reporteService.GetReporteNuevosClientesAsync(fechaInicio, fechaFin);
        return Ok(result);
    }
}
