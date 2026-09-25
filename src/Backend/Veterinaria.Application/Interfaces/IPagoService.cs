using Veterinaria.Application.DTOs;
using Veterinaria.Domain.Entities;

namespace Veterinaria.Application.Interfaces;

public interface IPagoService
{
    Task<(List<Pago> Pagos, decimal TotalTarjeta, decimal TotalEfectivo, int TotalPagos)> GetPagosFiltradosAsync(string? tipoPago, string? metodoPago, DateTime? fechaDesde, DateTime? fechaHasta);
    Task<Pago?> GetPagoDetailsAsync(int id);
    Task<Cita?> GetCitaWithPagosAsync(int citaId);
    Task<ReportePagosDto> GetReportePagosAsync(DateTime fechaDesde, DateTime fechaHasta);
    Task<List<Cita>> GetCitasPendientesPagoAsync();

    Task<Cita?> GetCitaForPagoAsync(int citaId);
    Task<TarjetaGuardada?> GetTarjetaGuardadaAsync(int usuarioId);
    Task<Pago> ProcesarPagoTarjetaAsync(int citaId, decimal montoTotal, decimal montoPagar, string tipoPago, string numeroTarjeta, bool guardarTarjeta, string nombreTitular, string fechaVencimiento, string cvv, int? usuarioId);
    Task<Pago> ProcesarPagoRestanteTarjetaAsync(int citaId, string numeroTarjeta);
    Task<Pago?> GetPagoByIdAsync(int pagoId);
    Task<(bool Success, string Message)> AnularPagoAsync(int pagoId, string motivo);
    Task<List<Pago>> GetPagosPorUsuarioAsync(int usuarioId);
    Task<(bool Success, Pago? Pago, string? Error)> RegistrarCobroManualAsync(int citaId, decimal montoTotalAjustado, decimal montoAbonado, string metodoPago, string? referencia, string? observacion, string usuarioOperador);

    // Sprint 6: Ordenes de cobro, cobro mixto, idempotencia, verificaciones y cierre de caja
    Task<OrdenCobro> CrearOrdenCobroDesdeConsultaAsync(int historialClinicoId);
    Task<List<OrdenCobroDto>> GetOrdenesCobroPendientesAsync();
    Task<(bool Success, Pago? Pago, string? Error)> ProcesarPagoMixtoAsync(ProcesarPagoMixtoDto dto, string usuarioOperador);
    Task<List<Pago>> GetPagosPendientesVerificacionAsync();
    Task<(bool Success, string Message)> CambiarEstadoVerificacionPagoAsync(int pagoId, string nuevoEstado, string usuarioAdmin);
    Task<CierreCajaDto> GetCierreCajaDiarioAsync(DateTime fecha, int? cajeroId = null);
}
