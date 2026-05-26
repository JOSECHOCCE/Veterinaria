using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Veterinaria.Application.Interfaces;
using Veterinaria.Web.Models.Dto;
using X.PagedList.Extensions;
using AutoMapper;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System;

namespace Veterinaria.Web.Controllers;

[Authorize(Roles = "Admin")]
public class PagosController : Controller
{
    private readonly IPagoService _pagoService;
    private readonly IMapper _mapper;

    public PagosController(IPagoService pagoService, IMapper mapper)
    {
        _pagoService = pagoService;
        _mapper = mapper;
    }

    // GET: Pagos
    public async Task<IActionResult> Index(string? tipoPago, string? metodoPago, DateTime? fechaDesde, DateTime? fechaHasta, int page = 1)
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

        ViewBag.TotalTarjeta = totalTarjeta;
        ViewBag.TotalEfectivo = totalEfectivo;
        ViewBag.TotalGeneral = totalTarjeta + totalEfectivo;
        ViewBag.TotalPagos = totalPagos;

        // Cargar ViewBag para filtros
        ViewBag.TiposPago = new SelectList(new[] 
        { 
            new { Value = "Completo", Text = "Completo" },
            new { Value = "Parcial", Text = "Parcial" },
            new { Value = "Restante", Text = "Restante" }
        }, "Value", "Text", tipoPago);

        ViewBag.MetodosPago = new SelectList(new[] 
        { 
            new { Value = "Tarjeta", Text = "Tarjeta" },
            new { Value = "Efectivo", Text = "Efectivo" }
        }, "Value", "Text", metodoPago);

        ViewBag.CurrentTipoPago = tipoPago;
        ViewBag.CurrentMetodoPago = metodoPago;
        ViewBag.CurrentFechaDesde = fechaDesde?.ToString("yyyy-MM-dd");
        ViewBag.CurrentFechaHasta = fechaHasta?.ToString("yyyy-MM-dd");

        return View(pagosDto.ToPagedList(page, 15));
    }

    // GET: Pagos/Details/5
    public async Task<IActionResult> Details(int id)
    {
        var pago = await _pagoService.GetPagoDetailsAsync(id);

        if (pago == null)
        {
            return NotFound();
        }

        var dto = _mapper.Map<PagoDto>(pago);
        dto.MascotaNombre = pago.Cita?.Mascota?.Nombre;
        dto.PropietarioNombre = pago.Cita?.Mascota?.Usuario?.Nombre;
        dto.VeterinarioNombre = pago.Cita?.Veterinario?.Nombre;
        dto.ServicioNombre = pago.Cita?.Servicio?.Nombre;
        dto.FechaCita = pago.Cita?.FechaHora;
        
        return View(dto);
    }

    // GET: Pagos/DetailsByCita?citaId=5
    public async Task<IActionResult> DetailsByCita(int citaId)
    {
        var cita = await _pagoService.GetCitaWithPagosAsync(citaId);

        if (cita == null)
        {
            return NotFound();
        }

        ViewBag.Cita = cita;
        ViewBag.Pagos = cita.Pagos?.OrderByDescending(p => p.FechaPago).ToList() ?? new List<Veterinaria.Domain.Entities.Pago>();

        return View();
    }

    // GET: Pagos/Reporte
    public async Task<IActionResult> Reporte(DateTime? fechaDesde, DateTime? fechaHasta)
    {
        // Si no se especifican fechas, usar el mes actual
        var desde = fechaDesde ?? new DateTime(DateTime.Now.Year, DateTime.Now.Month, 1);
        var hasta = fechaHasta ?? DateTime.Now;

        var reporte = await _pagoService.GetReportePagosAsync(desde, hasta);

        // Totales generales
        ViewBag.TotalRecaudado = reporte.TotalRecaudado;
        ViewBag.TotalPagos = reporte.TotalPagos;
        ViewBag.TotalTarjeta = reporte.TotalTarjeta;
        ViewBag.TotalEfectivo = reporte.TotalEfectivo;

        // Por tipo de pago
        ViewBag.TotalCompletos = reporte.TotalCompletos;
        ViewBag.TotalParciales = reporte.TotalParciales;
        ViewBag.TotalRestantes = reporte.TotalRestantes;

        ViewBag.PagosPorDia = reporte.PagosPorDia;
        ViewBag.PagosPorServicio = reporte.PagosPorServicio;

        ViewBag.FechaDesde = desde.ToString("yyyy-MM-dd");
        ViewBag.FechaHasta = hasta.ToString("yyyy-MM-dd");

        return View();
    }

    // GET: Pagos/PendientesPago - Lista de citas con pagos pendientes (parciales)
    public async Task<IActionResult> PendientesPago()
    {
        var citasPendientes = await _pagoService.GetCitasPendientesPagoAsync();
        return View(citasPendientes);
    }
}
