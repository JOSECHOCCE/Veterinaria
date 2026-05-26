using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using Veterinaria.Application.DTOs;
using Veterinaria.Application.Interfaces;
using Veterinaria.Domain.Contracts;
using Veterinaria.Domain.Entities;

namespace Veterinaria.Application.Services;

public class PagoService : IPagoService
{
    private readonly IUnitOfWork _unitOfWork;

    public PagoService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<(List<Pago> Pagos, decimal TotalTarjeta, decimal TotalEfectivo, int TotalPagos)> GetPagosFiltradosAsync(string? tipoPago, string? metodoPago, DateTime? fechaDesde, DateTime? fechaHasta)
    {
        var query = _unitOfWork.Pagos.GetAll()
            .Include(p => p.Cita)
                .ThenInclude(c => c.Mascota)
                    .ThenInclude(m => m.Usuario)
            .Include(p => p.Cita)
                .ThenInclude(c => c.Veterinario)
            .Include(p => p.Cita)
                .ThenInclude(c => c.Servicio)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(tipoPago))
            query = query.Where(p => p.TipoPago == tipoPago);

        if (!string.IsNullOrWhiteSpace(metodoPago))
            query = query.Where(p => p.MetodoPago == metodoPago);

        if (fechaDesde.HasValue)
            query = query.Where(p => p.FechaPago.Date >= fechaDesde.Value.Date);

        if (fechaHasta.HasValue)
            query = query.Where(p => p.FechaPago.Date <= fechaHasta.Value.Date);

        var pagos = await query.OrderByDescending(p => p.FechaPago).ToListAsync();

        var totalTarjeta = pagos.Where(p => p.MetodoPago == "Tarjeta").Sum(p => p.Monto);
        var totalEfectivo = pagos.Where(p => p.MetodoPago == "Efectivo").Sum(p => p.Monto);
        var totalPagos = pagos.Count;

        return (pagos, totalTarjeta, totalEfectivo, totalPagos);
    }

    public async Task<Pago?> GetPagoDetailsAsync(int id)
    {
        var pago = await _unitOfWork.Pagos.GetAll()
            .Include(p => p.Cita)
                .ThenInclude(c => c.Mascota)
                    .ThenInclude(m => m.Usuario)
            .Include(p => p.Cita)
                .ThenInclude(c => c.Veterinario)
            .Include(p => p.Cita)
                .ThenInclude(c => c.Servicio)
            .FirstOrDefaultAsync(p => p.Id == id);

        return pago;
    }

    public async Task<Cita?> GetCitaWithPagosAsync(int citaId)
    {
        return await _unitOfWork.Citas.GetAll()
            .Include(c => c.Mascota)
                .ThenInclude(m => m.Usuario)
            .Include(c => c.Veterinario)
            .Include(c => c.Servicio)
            .Include(c => c.Pagos)
            .FirstOrDefaultAsync(c => c.Id == citaId);
    }

    public async Task<ReportePagosDto> GetReportePagosAsync(DateTime fechaDesde, DateTime fechaHasta)
    {
        var query = _unitOfWork.Pagos.GetAll()
            .Include(p => p.Cita)
                .ThenInclude(c => c.Servicio)
            .Where(p => p.FechaPago.Date >= fechaDesde.Date && 
                       p.FechaPago.Date <= fechaHasta.Date);

        var pagos = await query.ToListAsync();

        var reporte = new ReportePagosDto
        {
            TotalRecaudado = pagos.Sum(p => p.Monto),
            TotalPagos = pagos.Count,
            TotalTarjeta = pagos.Where(p => p.MetodoPago == "Tarjeta").Sum(p => p.Monto),
            TotalEfectivo = pagos.Where(p => p.MetodoPago == "Efectivo").Sum(p => p.Monto),
            TotalCompletos = pagos.Where(p => p.TipoPago == "Completo").Sum(p => p.Monto),
            TotalParciales = pagos.Where(p => p.TipoPago == "Parcial").Sum(p => p.Monto),
            TotalRestantes = pagos.Where(p => p.TipoPago == "Restante").Sum(p => p.Monto),
            PagosPorDia = pagos.GroupBy(p => p.FechaPago.Date)
                .Select(g => new PagoPorDiaDto
                { 
                    Fecha = g.Key.ToString("yyyy-MM-dd"), 
                    Total = g.Sum(p => p.Monto) 
                })
                .OrderBy(x => x.Fecha)
                .ToList(),
            PagosPorServicio = pagos.Where(p => p.Cita?.Servicio != null)
                .GroupBy(p => p.Cita!.Servicio!.Nombre)
                .Select(g => new PagoPorServicioDto
                { 
                    Servicio = g.Key, 
                    Total = g.Sum(p => p.Monto),
                    Cantidad = g.Count()
                })
                .OrderByDescending(x => x.Total)
                .ToList()
        };

        return reporte;
    }

    public async Task<List<Cita>> GetCitasPendientesPagoAsync()
    {
        return await _unitOfWork.Citas.GetAll()
            .Include(c => c.Mascota)
                .ThenInclude(m => m.Usuario)
            .Include(c => c.Servicio)
            .Include(c => c.Veterinario)
            .Where(c => c.EstadoPago == "Parcial" && c.Estado == "Completada")
            .OrderBy(c => c.FechaHora)
            .ToListAsync();
    }

    public async Task<Cita?> GetCitaForPagoAsync(int citaId)
    {
        return await _unitOfWork.Citas.GetAll()
            .Include(c => c.Mascota).ThenInclude(m => m.Usuario)
            .Include(c => c.Servicio)
            .Include(c => c.Veterinario)
            .FirstOrDefaultAsync(c => c.Id == citaId);
    }

    public async Task<TarjetaGuardada?> GetTarjetaGuardadaAsync(int usuarioId)
    {
        return await _unitOfWork.TarjetasGuardadas.GetAll()
            .Where(t => t.UsuarioId == usuarioId && t.Activa)
            .OrderByDescending(t => t.FechaRegistro)
            .FirstOrDefaultAsync();
    }

    public async Task<Pago> ProcesarPagoTarjetaAsync(int citaId, decimal montoTotal, decimal montoPagar, string tipoPago, string numeroTarjeta, bool guardarTarjeta, string nombreTitular, string fechaVencimiento, string cvv, int? usuarioId)
    {
        var referencia = $"PAG-{DateTime.Now:yyyyMMdd}-{citaId:D4}-{new Random().Next(1000, 9999)}";

        var pago = new Pago
        {
            CitaId = citaId,
            Monto = montoPagar,
            MetodoPago = "Tarjeta",
            TipoPago = tipoPago,
            Referencia = referencia,
            UltimosDigitosTarjeta = numeroTarjeta.Substring(numeroTarjeta.Length - 4),
            FechaPago = DateTime.Now
        };

        await _unitOfWork.Pagos.AddAsync(pago);

        var cita = await _unitOfWork.Citas.GetByIdAsync(citaId);
        if(cita != null) {
            cita.MontoTotal = montoTotal;
            cita.MontoPagado = montoPagar;
            cita.TipoPago = tipoPago;
            cita.EstadoPago = tipoPago == "Completo" ? "Pagado" : "Parcial";
            cita.Estado = "Confirmada";
            _unitOfWork.Citas.Update(cita);
        }

        if (guardarTarjeta && usuarioId.HasValue)
        {
            var tarjetaExistente = await _unitOfWork.TarjetasGuardadas.GetAll()
                .Where(t => t.UsuarioId == usuarioId.Value && t.Activa)
                .FirstOrDefaultAsync();

            if (tarjetaExistente != null)
            {
                tarjetaExistente.NombreTitular = EncriptarSimple(nombreTitular);
                tarjetaExistente.NumeroTarjetaEncriptado = EncriptarSimple(numeroTarjeta);
                tarjetaExistente.UltimosDigitos = numeroTarjeta.Substring(numeroTarjeta.Length - 4);
                tarjetaExistente.FechaExpiracion = fechaVencimiento;
                tarjetaExistente.CVVEncriptado = EncriptarSimple(cvv);
                tarjetaExistente.FechaRegistro = DateTime.UtcNow;
                _unitOfWork.TarjetasGuardadas.Update(tarjetaExistente);
            }
            else
            {
                var nuevaTarjeta = new TarjetaGuardada
                {
                    UsuarioId = usuarioId.Value,
                    NombreTitular = EncriptarSimple(nombreTitular),
                    NumeroTarjetaEncriptado = EncriptarSimple(numeroTarjeta),
                    UltimosDigitos = numeroTarjeta.Substring(numeroTarjeta.Length - 4),
                    FechaExpiracion = fechaVencimiento,
                    CVVEncriptado = EncriptarSimple(cvv),
                    Activa = true
                };
                await _unitOfWork.TarjetasGuardadas.AddAsync(nuevaTarjeta);
            }
        }

        await _unitOfWork.CommitAsync();

        return pago;
    }

    public async Task<Pago> ProcesarPagoRestanteTarjetaAsync(int citaId, string numeroTarjeta)
    {
        var cita = await _unitOfWork.Citas.GetByIdAsync(citaId);
        var montoRestante = cita!.MontoTotal - cita.MontoPagado;
        var referencia = $"PAG-{DateTime.Now:yyyyMMdd}-{citaId:D4}-{new Random().Next(1000, 9999)}";

        var pago = new Pago
        {
            CitaId = citaId,
            Monto = montoRestante,
            MetodoPago = "Tarjeta",
            TipoPago = "Restante",
            Referencia = referencia,
            UltimosDigitosTarjeta = numeroTarjeta.Substring(12),
            FechaPago = DateTime.Now
        };

        await _unitOfWork.Pagos.AddAsync(pago);

        cita.MontoPagado = cita.MontoTotal;
        cita.EstadoPago = "Pagado";

        _unitOfWork.Citas.Update(cita);
        await _unitOfWork.CommitAsync();

        return pago;
    }

    public async Task<Pago?> GetPagoByIdAsync(int pagoId)
    {
        return await _unitOfWork.Pagos.GetByIdAsync(pagoId);
    }

    private string EncriptarSimple(string texto)
    {
        if (string.IsNullOrEmpty(texto)) return string.Empty;
        var bytes = System.Text.Encoding.UTF8.GetBytes(texto);
        return Convert.ToBase64String(bytes);
    }
}
