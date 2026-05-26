namespace Veterinaria.Application.DTOs;

public class ReportePagosDto
{
    public decimal TotalRecaudado { get; set; }
    public int TotalPagos { get; set; }
    public decimal TotalTarjeta { get; set; }
    public decimal TotalEfectivo { get; set; }
    public decimal TotalCompletos { get; set; }
    public decimal TotalParciales { get; set; }
    public decimal TotalRestantes { get; set; }

    public List<PagoPorDiaDto> PagosPorDia { get; set; } = new();
    public List<PagoPorServicioDto> PagosPorServicio { get; set; } = new();
}

public class PagoPorDiaDto
{
    public string Fecha { get; set; } = string.Empty;
    public decimal Total { get; set; }
}

public class PagoPorServicioDto
{
    public string Servicio { get; set; } = string.Empty;
    public decimal Total { get; set; }
    public int Cantidad { get; set; }
}
