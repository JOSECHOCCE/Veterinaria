using System;
using System.Threading.Tasks;
using Veterinaria.Application.DTOs;

namespace Veterinaria.Application.Interfaces;

public interface IReporteService
{
    Task<Response<ReporteCitasDto>> GetReporteCitasAsync(DateTime? fechaInicio, DateTime? fechaFin, string? estado, int? veterinarioId);
    Task<Response<ReporteIngresosDto>> GetReporteIngresosAsync(DateTime? fechaInicio, DateTime? fechaFin, string? metodoPago);
    Task<Response<ReporteNuevosClientesDto>> GetReporteNuevosClientesAsync(DateTime? fechaInicio, DateTime? fechaFin);
    Task<byte[]> ExportarReporteCitasCsvAsync(DateTime? fechaInicio, DateTime? fechaFin, string? estado, int? veterinarioId);
    Task<byte[]> ExportarReporteIngresosCsvAsync(DateTime? fechaInicio, DateTime? fechaFin, string? metodoPago);

    // Sprint 9
    Task<ReporteIngresosCategorizadoDto> ObtenerIngresosCategorizadosAsync(DateTime fechaInicio, DateTime fechaFin);
}

public class ReporteIngresosCategorizadoDto
{
    public DateTime FechaInicio { get; set; }
    public DateTime FechaFin { get; set; }
    public decimal TotalServiciosMedicos { get; set; }
    public decimal TotalFarmaciaBotica { get; set; }
    public decimal TotalPetshopRetail { get; set; }
    public decimal TotalGeneral => TotalServiciosMedicos + TotalFarmaciaBotica + TotalPetshopRetail;
    public int CantidadOrdenesServicios { get; set; }
    public int CantidadVentasFarmacia { get; set; }
    public int CantidadVentasPetshop { get; set; }
}
