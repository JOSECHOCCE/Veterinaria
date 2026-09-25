using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Veterinaria.Application.DTOs;
using Veterinaria.Application.Interfaces;
using Veterinaria.Domain.Contracts;
using Veterinaria.Domain.Entities;

namespace Veterinaria.Application.Services;

public class ReporteService : IReporteService
{
    private readonly IUnitOfWork _unitOfWork;

    public ReporteService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Response<ReporteCitasDto>> GetReporteCitasAsync(DateTime? fechaInicio, DateTime? fechaFin, string? estado, int? veterinarioId)
    {
        var query = _unitOfWork.Citas.GetAll()
            .Include(c => c.Mascota)
            .Include(c => c.Servicio)
            .Include(c => c.Veterinario)
            .AsQueryable();

        if (fechaInicio.HasValue) query = query.Where(c => c.FechaHora >= fechaInicio.Value);
        if (fechaFin.HasValue) query = query.Where(c => c.FechaHora <= fechaFin.Value);
        if (!string.IsNullOrWhiteSpace(estado)) query = query.Where(c => c.Estado == estado);
        if (veterinarioId.HasValue) query = query.Where(c => c.VeterinarioId == veterinarioId.Value);

        var list = await query.OrderByDescending(c => c.FechaHora).ToListAsync();

        var dto = new ReporteCitasDto
        {
            FechaInicio = fechaInicio ?? DateTime.MinValue,
            FechaFin = fechaFin ?? DateTime.MaxValue,
            TotalCitas = list.Count,
            Completadas = list.Count(c => c.Estado == "Completada"),
            Canceladas = list.Count(c => c.Estado == "Cancelada"),
            Pendientes = list.Count(c => c.Estado == "Pendiente" || c.Estado == "Confirmada"),
            Detalle = list.Select(c => new CitaReporteItemDto
            {
                CitaId = c.Id,
                FechaHora = c.FechaHora,
                Estado = c.Estado,
                Mascota = c.Mascota?.Nombre ?? "",
                Servicio = c.Servicio?.Nombre ?? "",
                Veterinario = c.Veterinario?.Nombre ?? "",
                MontoTotal = c.MontoTotal
            }).ToList()
        };

        return Response<ReporteCitasDto>.Ok(dto);
    }

    public async Task<Response<ReporteIngresosDto>> GetReporteIngresosAsync(DateTime? fechaInicio, DateTime? fechaFin, string? metodoPago)
    {
        var query = _unitOfWork.Pagos.GetAll()
            .Include(p => p.Cita)
            .ThenInclude(c => c!.Servicio)
            .AsQueryable();

        if (fechaInicio.HasValue) query = query.Where(p => p.FechaPago >= fechaInicio.Value);
        if (fechaFin.HasValue) query = query.Where(p => p.FechaPago <= fechaFin.Value);
        if (!string.IsNullOrWhiteSpace(metodoPago)) query = query.Where(p => p.MetodoPago == metodoPago);

        var list = await query.OrderByDescending(p => p.FechaPago).ToListAsync();

        var dto = new ReporteIngresosDto
        {
            FechaInicio = fechaInicio ?? DateTime.MinValue,
            FechaFin = fechaFin ?? DateTime.MaxValue,
            TotalIngresos = list.Sum(p => p.Monto),
            TotalEfectivo = list.Where(p => p.MetodoPago == "Efectivo").Sum(p => p.Monto),
            TotalTarjeta = list.Where(p => p.MetodoPago == "Tarjeta").Sum(p => p.Monto),
            Detalle = list.Select(p => new IngresoReporteItemDto
            {
                PagoId = p.Id,
                FechaPago = p.FechaPago,
                Monto = p.Monto,
                MetodoPago = p.MetodoPago,
                Concepto = p.Cita != null ? $"Pago Cita #{p.CitaId} - {p.Cita.Servicio?.Nombre}" : $"Pago #{p.Id}"
            }).ToList()
        };

        return Response<ReporteIngresosDto>.Ok(dto);
    }

    public async Task<Response<ReporteNuevosClientesDto>> GetReporteNuevosClientesAsync(DateTime? fechaInicio, DateTime? fechaFin)
    {
        var query = _unitOfWork.Usuarios.GetAll()
            .Include(u => u.Mascotas)
            .Where(u => u.Rol == "Cliente");

        if (fechaInicio.HasValue) query = query.Where(u => u.FechaRegistro >= fechaInicio.Value);
        if (fechaFin.HasValue) query = query.Where(u => u.FechaRegistro <= fechaFin.Value);

        var list = await query.OrderByDescending(u => u.FechaRegistro).ToListAsync();

        var dto = new ReporteNuevosClientesDto
        {
            FechaInicio = fechaInicio ?? DateTime.MinValue,
            FechaFin = fechaFin ?? DateTime.MaxValue,
            TotalNuevosClientes = list.Count,
            TotalNuevasMascotas = list.Sum(u => u.Mascotas.Count),
            Detalle = list.Select(u => new NuevoClienteReporteItemDto
            {
                ClienteId = u.Id,
                Nombre = u.Nombre,
                FechaRegistro = u.FechaRegistro,
                CantidadMascotas = u.Mascotas.Count
            }).ToList()
        };

        return Response<ReporteNuevosClientesDto>.Ok(dto);
    }

    public async Task<byte[]> ExportarReporteCitasCsvAsync(DateTime? fechaInicio, DateTime? fechaFin, string? estado, int? veterinarioId)
    {
        var res = await GetReporteCitasAsync(fechaInicio, fechaFin, estado, veterinarioId);
        var sb = new StringBuilder();
        sb.AppendLine("CitaId,FechaHora,Mascota,Servicio,Veterinario,Estado,MontoTotal");

        if (res.Data != null)
        {
            foreach (var item in res.Data.Detalle)
            {
                sb.AppendLine($"{item.CitaId},{item.FechaHora:yyyy-MM-dd HH:mm},\"{EscaparCsv(item.Mascota)}\",\"{EscaparCsv(item.Servicio)}\",\"{EscaparCsv(item.Veterinario)}\",{item.Estado},{item.MontoTotal}");
            }
        }

        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    public async Task<byte[]> ExportarReporteIngresosCsvAsync(DateTime? fechaInicio, DateTime? fechaFin, string? metodoPago)
    {
        var res = await GetReporteIngresosAsync(fechaInicio, fechaFin, metodoPago);
        var sb = new StringBuilder();
        sb.AppendLine("PagoId,FechaPago,MetodoPago,Monto,Concepto");

        if (res.Data != null)
        {
            foreach (var item in res.Data.Detalle)
            {
                sb.AppendLine($"{item.PagoId},{item.FechaPago:yyyy-MM-dd HH:mm},{item.MetodoPago},{item.Monto},\"{EscaparCsv(item.Concepto)}\"");
            }
        }

        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    public async Task<ReporteIngresosCategorizadoDto> ObtenerIngresosCategorizadosAsync(DateTime fechaInicio, DateTime fechaFin)
    {
        // 1. Servicios Médicos (OrdenesCobro pagadas)
        var ordenesPagadas = await _unitOfWork.OrdenesCobro.GetAll()
            .Where(o => (o.Estado == "Pagada" || o.Estado == "Pagado") && o.Fecha >= fechaInicio && o.Fecha <= fechaFin)
            .ToListAsync();

        decimal totalServicios = ordenesPagadas.Sum(o => o.MontoTotal);
        int cantidadOrdenesServicios = ordenesPagadas.Count;

        // 2. Ventas (Farmacia vs Petshop)
        var ventas = await _unitOfWork.Ventas.GetAll()
            .Include(v => v.Detalles)
            .ThenInclude(d => d.Producto)
            .Where(v => v.Estado == "Completada" && v.Fecha >= fechaInicio && v.Fecha <= fechaFin)
            .ToListAsync();

        decimal totalFarmacia = 0m;
        int cantidadVentasFarmacia = 0;

        decimal totalPetshop = 0m;
        int cantidadVentasPetshop = 0;

        foreach (var venta in ventas)
        {
            bool esFarmacia = venta.RecetaId.HasValue || venta.Detalles.Any(d => d.Producto != null && (d.Producto.RequiereReceta || d.Producto.Categoria == "Medicamento"));
            if (esFarmacia)
            {
                totalFarmacia += venta.Total;
                cantidadVentasFarmacia++;
            }
            else
            {
                totalPetshop += venta.Total;
                cantidadVentasPetshop++;
            }
        }

        return new ReporteIngresosCategorizadoDto
        {
            FechaInicio = fechaInicio,
            FechaFin = fechaFin,
            TotalServiciosMedicos = totalServicios,
            TotalFarmaciaBotica = totalFarmacia,
            TotalPetshopRetail = totalPetshop,
            CantidadOrdenesServicios = cantidadOrdenesServicios,
            CantidadVentasFarmacia = cantidadVentasFarmacia,
            CantidadVentasPetshop = cantidadVentasPetshop
        };
    }

    private static string EscaparCsv(string campo)
    {
        if (string.IsNullOrEmpty(campo)) return string.Empty;
        return campo.Replace("\"", "\"\"");
    }
}
