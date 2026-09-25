using System.Collections.Generic;

namespace Veterinaria.Application.DTOs;

public class CierreCajaDto
{
    public string Fecha { get; set; } = default!;
    public decimal TotalGeneral { get; set; }
    public decimal TotalEfectivo { get; set; }
    public decimal TotalTarjeta { get; set; }
    public decimal TotalYape { get; set; }
    public decimal TotalPlin { get; set; }
    public decimal TotalTransferencia { get; set; }
    public int PagosPendientesVerificacionCount { get; set; }
    public List<CierreCajaPorCajeroDto> TotalesPorCajero { get; set; } = new();
}

public class CierreCajaPorCajeroDto
{
    public int? CajeroId { get; set; }
    public string NombreCajero { get; set; } = default!;
    public decimal Total { get; set; }
    public int CantidadPagos { get; set; }
}
