using System;
using System.Collections.Generic;

namespace Veterinaria.Application.DTOs;

public class CitaReporteItemDto
{
    public int CitaId { get; set; }
    public DateTime FechaHora { get; set; }
    public string Estado { get; set; } = string.Empty;
    public string Mascota { get; set; } = string.Empty;
    public string Servicio { get; set; } = string.Empty;
    public string Veterinario { get; set; } = string.Empty;
    public decimal MontoTotal { get; set; }
}

public class ReporteCitasDto
{
    public DateTime FechaInicio { get; set; }
    public DateTime FechaFin { get; set; }
    public int TotalCitas { get; set; }
    public int Completadas { get; set; }
    public int Canceladas { get; set; }
    public int Pendientes { get; set; }
    public List<CitaReporteItemDto> Detalle { get; set; } = new List<CitaReporteItemDto>();
}

public class IngresoReporteItemDto
{
    public int PagoId { get; set; }
    public DateTime FechaPago { get; set; }
    public decimal Monto { get; set; }
    public string MetodoPago { get; set; } = string.Empty;
    public string Concepto { get; set; } = string.Empty;
}

public class ReporteIngresosDto
{
    public DateTime FechaInicio { get; set; }
    public DateTime FechaFin { get; set; }
    public decimal TotalIngresos { get; set; }
    public decimal TotalEfectivo { get; set; }
    public decimal TotalTarjeta { get; set; }
    public List<IngresoReporteItemDto> Detalle { get; set; } = new List<IngresoReporteItemDto>();
}

public class NuevoClienteReporteItemDto
{
    public int ClienteId { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public DateTime FechaRegistro { get; set; }
    public int CantidadMascotas { get; set; }
}

public class ReporteNuevosClientesDto
{
    public DateTime FechaInicio { get; set; }
    public DateTime FechaFin { get; set; }
    public int TotalNuevosClientes { get; set; }
    public int TotalNuevasMascotas { get; set; }
    public List<NuevoClienteReporteItemDto> Detalle { get; set; } = new List<NuevoClienteReporteItemDto>();
}
