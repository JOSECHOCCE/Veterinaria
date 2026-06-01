using System;
using System.Threading.Tasks;
using Veterinaria.Application.DTOs;

namespace Veterinaria.Application.Interfaces;

public interface IReporteService
{
    Task<Response<ReporteCitasDto>> GetReporteCitasAsync(DateTime fechaInicio, DateTime fechaFin, string? estado, int? veterinarioId);
    Task<Response<ReporteIngresosDto>> GetReporteIngresosAsync(DateTime fechaInicio, DateTime fechaFin, string? metodoPago);
    Task<Response<ReporteNuevosClientesDto>> GetReporteNuevosClientesAsync(DateTime fechaInicio, DateTime fechaFin);
    Task<byte[]> ExportarReporteCitasCsvAsync(DateTime fechaInicio, DateTime fechaFin, string? estado, int? veterinarioId);
    Task<byte[]> ExportarReporteIngresosCsvAsync(DateTime fechaInicio, DateTime fechaFin, string? metodoPago);
}
