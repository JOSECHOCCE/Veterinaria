using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Veterinaria.Application.Interfaces;
using Veterinaria.Web.Models.Dto;
using AutoMapper;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System;
using Veterinaria.Application.DTOs;

namespace Veterinaria.Web.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/[controller]")]
public class PagosController : ControllerBase
{
    private readonly IPagoService _pagoService;
    private readonly IMapper _mapper;

    public PagosController(IPagoService pagoService, IMapper mapper)
    {
        _pagoService = pagoService;
        _mapper = mapper;
    }

    [HttpGet]
    public async Task<ActionResult<Response<object>>> Index(string? tipoPago, string? metodoPago, DateTime? fechaDesde, DateTime? fechaHasta, int page = 1)
    {
        var (pagos, totalTarjeta, totalEfectivo, totalPagos) = await _pagoService.GetPagosFiltradosAsync(tipoPago, metodoPago, fechaDesde, fechaHasta);

        var pagosDto = _mapper.Map<List<PagoDto>>(pagos);
        foreach (var pagoDto in pagosDto)
        {
            var p = pagos.First(x => x.Id == pagoDto.Id);
            pagoDto.MascotaNombre = p.Cita?.Mascota?.Nombre;
            pagoDto.PropietarioNombre = p.Cita?.Mascota?.Usuario?.Nombre;
            pagoDto.VeterinarioNombre = p.Cita?.Veterinario?.Nombre;
            pagoDto.ServicioNombre = p.Cita?.Servicio?.Nombre;
            pagoDto.FechaCita = p.Cita?.FechaHora;
        }

        var result = new
        {
            Pagos = pagosDto,
            TotalTarjeta = totalTarjeta,
            TotalEfectivo = totalEfectivo,
            TotalGeneral = totalTarjeta + totalEfectivo,
            TotalPagos = totalPagos,
            CurrentTipoPago = tipoPago,
            CurrentMetodoPago = metodoPago,
            CurrentFechaDesde = fechaDesde?.ToString("yyyy-MM-dd"),
            CurrentFechaHasta = fechaHasta?.ToString("yyyy-MM-dd")
        };

        return Ok(Response<object>.Ok(result));
    }

    [HttpGet("Details/{id}")]
    public async Task<ActionResult<Response<object>>> Details(int id)
    {
        var pago = await _pagoService.GetPagoDetailsAsync(id);

        if (pago == null)
        {
            return NotFound(Response<object>.Fail("Pago no encontrado."));
        }

        var dto = _mapper.Map<PagoDto>(pago);
        dto.MascotaNombre = pago.Cita?.Mascota?.Nombre;
        dto.PropietarioNombre = pago.Cita?.Mascota?.Usuario?.Nombre;
        dto.VeterinarioNombre = pago.Cita?.Veterinario?.Nombre;
        dto.ServicioNombre = pago.Cita?.Servicio?.Nombre;
        dto.FechaCita = pago.Cita?.FechaHora;
        
        return Ok(Response<object>.Ok(dto));
    }

    [HttpGet("DetailsByCita")]
    public async Task<ActionResult<Response<object>>> DetailsByCita(int citaId)
    {
        var cita = await _pagoService.GetCitaWithPagosAsync(citaId);

        if (cita == null)
        {
            return NotFound(Response<object>.Fail("Cita no encontrada."));
        }

        var result = new
        {
            Cita = cita,
            Pagos = cita.Pagos?.OrderByDescending(p => p.FechaPago).ToList() ?? new List<Veterinaria.Domain.Entities.Pago>()
        };

        return Ok(Response<object>.Ok(result));
    }

    [HttpGet("Reporte")]
    public async Task<ActionResult<Response<object>>> Reporte(DateTime? fechaDesde, DateTime? fechaHasta)
    {
        var desde = fechaDesde ?? new DateTime(DateTime.Now.Year, DateTime.Now.Month, 1);
        var hasta = fechaHasta ?? DateTime.Now;

        var reporte = await _pagoService.GetReportePagosAsync(desde, hasta);

        var result = new
        {
            TotalRecaudado = reporte.TotalRecaudado,
            TotalPagos = reporte.TotalPagos,
            TotalTarjeta = reporte.TotalTarjeta,
            TotalEfectivo = reporte.TotalEfectivo,
            TotalCompletos = reporte.TotalCompletos,
            TotalParciales = reporte.TotalParciales,
            TotalRestantes = reporte.TotalRestantes,
            PagosPorDia = reporte.PagosPorDia,
            PagosPorServicio = reporte.PagosPorServicio,
            FechaDesde = desde.ToString("yyyy-MM-dd"),
            FechaHasta = hasta.ToString("yyyy-MM-dd")
        };

        return Ok(Response<object>.Ok(result));
    }

    [HttpGet("PendientesPago")]
    public async Task<ActionResult<Response<object>>> PendientesPago()
    {
        var citasPendientes = await _pagoService.GetCitasPendientesPagoAsync();
        return Ok(Response<object>.Ok(citasPendientes));
    }
}
