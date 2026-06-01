using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Veterinaria.Application.DTOs;
using Veterinaria.Application.Interfaces;
using Veterinaria.Domain.Contracts;

namespace Veterinaria.Application.Services;

public class ReporteService : IReporteService
{
    private readonly IUnitOfWork _unitOfWork;

    public ReporteService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Response<ReporteCitasDto>> GetReporteCitasAsync(DateTime fechaInicio, DateTime fechaFin, string? estado, int? veterinarioId)
    {
        // Ajustar fechas para cubrir todo el día de fin
        var endOfDay = fechaFin.Date.AddDays(1).AddTicks(-1);

        var query = _unitOfWork.Citas.GetAll()
            .Include(c => c.Mascota)
            .Include(c => c.Servicio)
            .Include(c => c.Veterinario)
            .Where(c => c.FechaHora >= fechaInicio.Date && c.FechaHora <= endOfDay);

        if (!string.IsNullOrEmpty(estado))
        {
            query = query.Where(c => c.Estado == estado);
        }

        if (veterinarioId.HasValue && veterinarioId.Value > 0)
        {
            query = query.Where(c => c.VeterinarioId == veterinarioId.Value);
        }

        var citas = await query.OrderBy(c => c.FechaHora).ToListAsync();

        var dto = new ReporteCitasDto
        {
            FechaInicio = fechaInicio.Date,
            FechaFin = fechaFin.Date,
            TotalCitas = citas.Count,
            Completadas = citas.Count(c => c.Estado == "Completada"),
            Canceladas = citas.Count(c => c.Estado == "Cancelada"),
            Pendientes = citas.Count(c => c.Estado == "Pendiente" || c.Estado == "Confirmada" || c.Estado == "PendienteConfirmacion"),
            Detalle = citas.Select(c => new CitaReporteItemDto
            {
                CitaId = c.Id,
                FechaHora = c.FechaHora,
                Estado = c.Estado,
                Mascota = c.Mascota?.Nombre ?? "N/A",
                Servicio = c.Servicio?.Nombre ?? "N/A",
                Veterinario = c.Veterinario?.Nombre ?? "Sin asignar",
                MontoTotal = c.MontoTotal
            }).ToList()
        };

        return Response<ReporteCitasDto>.Ok(dto);
    }

    public async Task<Response<ReporteIngresosDto>> GetReporteIngresosAsync(DateTime fechaInicio, DateTime fechaFin, string? metodoPago)
    {
        var endOfDay = fechaFin.Date.AddDays(1).AddTicks(-1);

        var query = _unitOfWork.Pagos.GetAll()
            .Include(p => p.Cita)
                .ThenInclude(c => c.Servicio)
            .Where(p => p.FechaPago >= fechaInicio.Date && p.FechaPago <= endOfDay);

        if (!string.IsNullOrEmpty(metodoPago))
        {
            query = query.Where(p => p.MetodoPago == metodoPago);
        }

        var pagos = await query.OrderBy(p => p.FechaPago).ToListAsync();

        var dto = new ReporteIngresosDto
        {
            FechaInicio = fechaInicio.Date,
            FechaFin = fechaFin.Date,
            TotalIngresos = pagos.Sum(p => p.Monto),
            TotalEfectivo = pagos.Where(p => p.MetodoPago == "Efectivo").Sum(p => p.Monto),
            TotalTarjeta = pagos.Where(p => p.MetodoPago == "Tarjeta").Sum(p => p.Monto),
            Detalle = pagos.Select(p => new IngresoReporteItemDto
            {
                PagoId = p.Id,
                FechaPago = p.FechaPago,
                Monto = p.Monto,
                MetodoPago = p.MetodoPago,
                Concepto = $"Pago Cita #{p.CitaId} - {(p.Cita?.Servicio?.Nombre ?? "Servicio")}"
            }).ToList()
        };

        return Response<ReporteIngresosDto>.Ok(dto);
    }

    public async Task<Response<ReporteNuevosClientesDto>> GetReporteNuevosClientesAsync(DateTime fechaInicio, DateTime fechaFin)
    {
        var endOfDay = fechaFin.Date.AddDays(1).AddTicks(-1);

        var clientes = await _unitOfWork.Usuarios.GetAll()
            .Include(u => u.Mascotas)
            .Where(u => u.Rol == "Cliente" && u.FechaRegistro >= fechaInicio.Date && u.FechaRegistro <= endOfDay)
            .OrderBy(u => u.FechaRegistro)
            .ToListAsync();

        var dto = new ReporteNuevosClientesDto
        {
            FechaInicio = fechaInicio.Date,
            FechaFin = fechaFin.Date,
            TotalNuevosClientes = clientes.Count,
            TotalNuevasMascotas = clientes.Sum(c => c.Mascotas.Count),
            Detalle = clientes.Select(c => new NuevoClienteReporteItemDto
            {
                ClienteId = c.Id,
                Nombre = c.Nombre,
                FechaRegistro = c.FechaRegistro,
                CantidadMascotas = c.Mascotas.Count
            }).ToList()
        };

        return Response<ReporteNuevosClientesDto>.Ok(dto);
    }

    public async Task<byte[]> ExportarReporteCitasCsvAsync(DateTime fechaInicio, DateTime fechaFin, string? estado, int? veterinarioId)
    {
        var reporteResult = await GetReporteCitasAsync(fechaInicio, fechaFin, estado, veterinarioId);
        var dto = reporteResult.Data;

        var sb = new StringBuilder();
        sb.AppendLine("Id,Fecha,Estado,Mascota,Servicio,Veterinario,MontoTotal");

        if (dto != null)
        {
            foreach (var item in dto.Detalle)
            {
                sb.AppendLine($"{item.CitaId},{item.FechaHora:yyyy-MM-dd HH:mm},{item.Estado},{EscapeCsv(item.Mascota)},{EscapeCsv(item.Servicio)},{EscapeCsv(item.Veterinario)},{item.MontoTotal}");
            }
        }

        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    public async Task<byte[]> ExportarReporteIngresosCsvAsync(DateTime fechaInicio, DateTime fechaFin, string? metodoPago)
    {
        var reporteResult = await GetReporteIngresosAsync(fechaInicio, fechaFin, metodoPago);
        var dto = reporteResult.Data;

        var sb = new StringBuilder();
        sb.AppendLine("PagoId,FechaPago,MetodoPago,Concepto,Monto");

        if (dto != null)
        {
            foreach (var item in dto.Detalle)
            {
                sb.AppendLine($"{item.PagoId},{item.FechaPago:yyyy-MM-dd HH:mm},{item.MetodoPago},{EscapeCsv(item.Concepto)},{item.Monto}");
            }
        }

        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    private string EscapeCsv(string value)
    {
        if (string.IsNullOrEmpty(value)) return string.Empty;
        if (value.Contains(",") || value.Contains("\"") || value.Contains("\n"))
        {
            return $"\"{value.Replace("\"", "\"\"")}\"";
        }
        return value;
    }
}
