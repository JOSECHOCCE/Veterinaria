using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Veterinaria.Application.Interfaces;
using Veterinaria.Domain.Entities;
using Veterinaria.Web.Models.Dto;
using X.PagedList.Extensions;

namespace Veterinaria.Web.Controllers;

[Authorize(Roles = "Admin")]
public class ServiciosController : Controller
{
    private readonly IServicioService _servicioService;
    private readonly IMapper _mapper;

    public ServiciosController(IServicioService servicioService, IMapper mapper)
    {
        _servicioService = servicioService;
        _mapper = mapper;
    }

    // GET: Servicios
    public IActionResult Index(string? q, bool? mostrarInactivos, int page = 1)
    {
        var serviciosEntities = _servicioService.GetServicios(q, mostrarInactivos);

        var servicios = serviciosEntities
            .Select(s => _mapper.Map<ServicioDto>(s))
            .ToPagedList(page, 10);

        ViewBag.CurrentFilter = q;
        ViewBag.MostrarInactivos = mostrarInactivos;

        return View(servicios);
    }

    // GET: Servicios/Details/5
    public async Task<IActionResult> Details(int id)
    {
        var servicio = await _servicioService.GetServicioWithCitasAsync(id);

        if (servicio == null)
        {
            return NotFound();
        }

        var servicioDto = _mapper.Map<ServicioDto>(servicio);
        ViewBag.TotalCitas = servicio.Citas.Count;
        ViewBag.CitasCompletadas = servicio.Citas.Count(c => c.Estado == "Completada");

        return View(servicioDto);
    }

    // GET: Servicios/Create
    public IActionResult Create()
    {
        var servicioDto = new ServicioDto
        {
            DuracionMinutos = 30,
            Precio = 0,
            Activo = true
        };
        return View(servicioDto);
    }

    // POST: Servicios/Create
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(ServicioDto servicioDto)
    {
        if (ModelState.IsValid)
        {
            var existeNombre = await _servicioService.ExistsNombreAsync(servicioDto.Nombre);

            if (existeNombre)
            {
                ModelState.AddModelError("Nombre", "Ya existe un servicio con este nombre.");
                return View(servicioDto);
            }

            var servicio = _mapper.Map<Servicio>(servicioDto);
            servicio.Activo = true;

            await _servicioService.AddServicioAsync(servicio);

            TempData["Success"] = "Servicio creado exitosamente.";
            return RedirectToAction(nameof(Index));
        }

        return View(servicioDto);
    }

    // GET: Servicios/Edit/5
    public async Task<IActionResult> Edit(int id)
    {
        var servicio = await _servicioService.GetServicioByIdAsync(id);
        if (servicio == null)
        {
            return NotFound();
        }

        var servicioDto = _mapper.Map<ServicioDto>(servicio);
        return View(servicioDto);
    }

    // POST: Servicios/Edit/5
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Edit(int id, ServicioDto servicioDto)
    {
        if (id != servicioDto.Id)
        {
            return NotFound();
        }

        if (ModelState.IsValid)
        {
            var existeNombre = await _servicioService.ExistsNombreAsync(servicioDto.Nombre, id);

            if (existeNombre)
            {
                ModelState.AddModelError("Nombre", "Ya existe un servicio con este nombre.");
                return View(servicioDto);
            }

            var servicio = await _servicioService.GetServicioByIdAsync(id);
            if (servicio == null)
            {
                return NotFound();
            }

            _mapper.Map(servicioDto, servicio);
            await _servicioService.UpdateServicioAsync(servicio);

            TempData["Success"] = "Servicio actualizado exitosamente.";
            return RedirectToAction(nameof(Index));
        }

        return View(servicioDto);
    }

    // GET: Servicios/Delete/5
    public async Task<IActionResult> Delete(int id)
    {
        var servicio = await _servicioService.GetServicioWithCitasAsync(id);

        if (servicio == null)
        {
            return NotFound();
        }

        var servicioDto = _mapper.Map<ServicioDto>(servicio);
        ViewBag.TieneCitas = servicio.Citas.Any();

        return View(servicioDto);
    }

    // POST: Servicios/Delete/5
    [HttpPost, ActionName("Delete")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> DeleteConfirmed(int id)
    {
        var deleted = await _servicioService.DeleteServicioAsync(id);

        if (!deleted)
        {
            // If it has citas, the service will return false, but maybe we should check before just in case?
            // Actually the original code checks if it has citas and redirects with an error message
            var servicio = await _servicioService.GetServicioWithCitasAsync(id);
            if (servicio == null) return NotFound();
            
            if (servicio.Citas.Any())
            {
                TempData["Error"] = "No se puede eliminar el servicio porque tiene citas asociadas. Puede desactivarlo en su lugar.";
                return RedirectToAction(nameof(Index));
            }
        }

        TempData["Success"] = "Servicio eliminado exitosamente.";
        return RedirectToAction(nameof(Index));
    }

    // POST: Servicios/ToggleActivo/5
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> ToggleActivo(int id)
    {
        var servicio = await _servicioService.GetServicioByIdAsync(id);
        if (servicio == null)
        {
            return NotFound();
        }

        await _servicioService.ToggleActivoAsync(id);

        TempData["Success"] = !servicio.Activo 
            ? "Servicio activado exitosamente." 
            : "Servicio desactivado exitosamente.";

        return RedirectToAction(nameof(Index));
    }

    // Método auxiliar para formatear duración
    public static string FormatearDuracion(int minutos)
    {
        if (minutos < 60)
        {
            return $"{minutos} min";
        }

        var horas = minutos / 60;
        var mins = minutos % 60;

        if (mins == 0)
        {
            return horas == 1 ? "1 hora" : $"{horas} horas";
        }

        return horas == 1 
            ? $"1 hora {mins} min" 
            : $"{horas} horas {mins} min";
    }
}
