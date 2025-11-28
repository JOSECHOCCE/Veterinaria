using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using Veterinaria.Domain.Contracts;
using Veterinaria.Domain.Entities;
using Veterinaria.Web.Models.Dto;
using X.PagedList.Extensions;

namespace Veterinaria.Web.Controllers;

[Authorize(Roles = "Admin")]
public class PagosController : Controller
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public PagosController(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    // GET: Pagos
    public async Task<IActionResult> Index(string? tipoPago, string? metodoPago, DateTime? fechaDesde, DateTime? fechaHasta, int page = 1)
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

        // Filtrar por tipo de pago
        if (!string.IsNullOrWhiteSpace(tipoPago))
        {
            query = query.Where(p => p.TipoPago == tipoPago);
        }

        // Filtrar por método de pago
        if (!string.IsNullOrWhiteSpace(metodoPago))
        {
            query = query.Where(p => p.MetodoPago == metodoPago);
        }

        // Filtrar por rango de fechas
        if (fechaDesde.HasValue)
        {
            query = query.Where(p => p.FechaPago.Date >= fechaDesde.Value.Date);
        }

        if (fechaHasta.HasValue)
        {
            query = query.Where(p => p.FechaPago.Date <= fechaHasta.Value.Date);
        }

        // Calcular totales
        var pagosFiltrados = await query.ToListAsync();
        
        var totalTarjeta = pagosFiltrados
            .Where(p => p.MetodoPago == "Tarjeta")
            .Sum(p => p.Monto);
        
        var totalEfectivo = pagosFiltrados
            .Where(p => p.MetodoPago == "Efectivo")
            .Sum(p => p.Monto);

        ViewBag.TotalTarjeta = totalTarjeta;
        ViewBag.TotalEfectivo = totalEfectivo;
        ViewBag.TotalGeneral = totalTarjeta + totalEfectivo;
        ViewBag.TotalPagos = pagosFiltrados.Count;

        // Ordenar por fecha de pago descendente
        var pagosOrdenados = pagosFiltrados
            .OrderByDescending(p => p.FechaPago)
            .ToList();

        // Mapear a DTOs
        var pagosDto = new List<PagoDto>();
        foreach (var pago in pagosOrdenados)
        {
            var dto = _mapper.Map<PagoDto>(pago);
            dto.MascotaNombre = pago.Cita?.Mascota?.Nombre;
            dto.PropietarioNombre = pago.Cita?.Mascota?.Usuario?.Nombre;
            dto.VeterinarioNombre = pago.Cita?.Veterinario?.Nombre;
            dto.ServicioNombre = pago.Cita?.Servicio?.Nombre;
            dto.FechaCita = pago.Cita?.FechaHora;
            pagosDto.Add(dto);
        }

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
        var pago = await _unitOfWork.Pagos.GetAll()
            .Include(p => p.Cita)
                .ThenInclude(c => c.Mascota)
                    .ThenInclude(m => m.Usuario)
            .Include(p => p.Cita)
                .ThenInclude(c => c.Veterinario)
            .Include(p => p.Cita)
                .ThenInclude(c => c.Servicio)
            .FirstOrDefaultAsync(p => p.Id == id);

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

        // Información adicional de la cita
        ViewBag.EstadoCita = pago.Cita?.Estado;
        ViewBag.EstadoPagoCita = pago.Cita?.EstadoPago;
        ViewBag.MontoTotalCita = pago.Cita?.MontoTotal ?? 0;
        ViewBag.MontoPagadoCita = pago.Cita?.MontoPagado ?? 0;

        return View(dto);
    }

    // GET: Pagos/DetailsByCita?citaId=5
    public async Task<IActionResult> DetailsByCita(int citaId)
    {
        var cita = await _unitOfWork.Citas.GetAll()
            .Include(c => c.Mascota)
                .ThenInclude(m => m.Usuario)
            .Include(c => c.Veterinario)
            .Include(c => c.Servicio)
            .Include(c => c.Pagos)
            .FirstOrDefaultAsync(c => c.Id == citaId);

        if (cita == null)
        {
            return NotFound();
        }

        ViewBag.Cita = cita;
        ViewBag.Pagos = cita.Pagos?.OrderByDescending(p => p.FechaPago).ToList() ?? new List<Pago>();

        return View();
    }

    // GET: Pagos/Reporte
    public async Task<IActionResult> Reporte(DateTime? fechaDesde, DateTime? fechaHasta)
    {
        // Si no se especifican fechas, usar el mes actual
        fechaDesde ??= new DateTime(DateTime.Now.Year, DateTime.Now.Month, 1);
        fechaHasta ??= DateTime.Now;

        var query = _unitOfWork.Pagos.GetAll()
            .Include(p => p.Cita)
                .ThenInclude(c => c.Servicio)
            .Where(p => p.FechaPago.Date >= fechaDesde.Value.Date && 
                       p.FechaPago.Date <= fechaHasta.Value.Date);

        var pagos = await query.ToListAsync();

        // Totales generales
        ViewBag.TotalRecaudado = pagos.Sum(p => p.Monto);
        ViewBag.TotalPagos = pagos.Count;
        ViewBag.TotalTarjeta = pagos.Where(p => p.MetodoPago == "Tarjeta").Sum(p => p.Monto);
        ViewBag.TotalEfectivo = pagos.Where(p => p.MetodoPago == "Efectivo").Sum(p => p.Monto);

        // Por tipo de pago
        ViewBag.TotalCompletos = pagos.Where(p => p.TipoPago == "Completo").Sum(p => p.Monto);
        ViewBag.TotalParciales = pagos.Where(p => p.TipoPago == "Parcial").Sum(p => p.Monto);
        ViewBag.TotalRestantes = pagos.Where(p => p.TipoPago == "Restante").Sum(p => p.Monto);

        // Pagos por día
        var pagosPorDia = pagos
            .GroupBy(p => p.FechaPago.Date)
            .Select(g => new 
            { 
                Fecha = g.Key.ToString("yyyy-MM-dd"), 
                Total = g.Sum(p => p.Monto) 
            })
            .OrderBy(x => x.Fecha)
            .ToList();

        ViewBag.PagosPorDia = pagosPorDia;

        // Pagos por servicio
        var pagosPorServicio = pagos
            .Where(p => p.Cita?.Servicio != null)
            .GroupBy(p => p.Cita!.Servicio!.Nombre)
            .Select(g => new 
            { 
                Servicio = g.Key, 
                Total = g.Sum(p => p.Monto),
                Cantidad = g.Count()
            })
            .OrderByDescending(x => x.Total)
            .ToList();

        ViewBag.PagosPorServicio = pagosPorServicio;

        ViewBag.FechaDesde = fechaDesde.Value.ToString("yyyy-MM-dd");
        ViewBag.FechaHasta = fechaHasta.Value.ToString("yyyy-MM-dd");

        return View();
    }

    // GET: Pagos/PendientesPago - Lista de citas con pagos pendientes (parciales)
    public async Task<IActionResult> PendientesPago()
    {
        var citasPendientes = await _unitOfWork.Citas.GetAll()
            .Include(c => c.Mascota)
                .ThenInclude(m => m.Usuario)
            .Include(c => c.Servicio)
            .Include(c => c.Veterinario)
            .Where(c => c.EstadoPago == "Parcial" && c.Estado == "Completada")
            .OrderBy(c => c.FechaHora)
            .ToListAsync();

        return View(citasPendientes);
    }
}
