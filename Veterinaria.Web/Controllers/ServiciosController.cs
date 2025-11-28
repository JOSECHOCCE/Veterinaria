using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Veterinaria.Domain.Contracts;
using Veterinaria.Domain.Entities;
using Veterinaria.Web.Models.Dto;
using X.PagedList.Extensions;

namespace Veterinaria.Web.Controllers;

[Authorize(Roles = "Admin")]
public class ServiciosController : Controller
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public ServiciosController(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    // GET: Servicios
    public IActionResult Index(string? q, bool? mostrarInactivos, int page = 1)
    {
        var query = _unitOfWork.Servicios.GetAll().AsQueryable();

        // Por defecto solo mostrar activos
        if (mostrarInactivos != true)
        {
            query = query.Where(s => s.Activo);
        }

        if (!string.IsNullOrWhiteSpace(q))
        {
            q = q.ToLower();
            query = query.Where(s => s.Nombre.ToLower().Contains(q) || 
                                     (s.Descripcion != null && s.Descripcion.ToLower().Contains(q)));
        }

        var servicios = query.OrderBy(s => s.Nombre)
            .Select(s => _mapper.Map<ServicioDto>(s))
            .ToPagedList(page, 10);

        ViewBag.CurrentFilter = q;
        ViewBag.MostrarInactivos = mostrarInactivos;

        return View(servicios);
    }

    // GET: Servicios/Details/5
    public async Task<IActionResult> Details(int id)
    {
        var servicio = await _unitOfWork.Servicios.GetAll()
            .Include(s => s.Citas)
            .FirstOrDefaultAsync(s => s.Id == id);

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
            // Verificar que no exista otro servicio con el mismo nombre
            var existeNombre = await _unitOfWork.Servicios.GetAll()
                .AnyAsync(s => s.Nombre.ToLower() == servicioDto.Nombre.ToLower());

            if (existeNombre)
            {
                ModelState.AddModelError("Nombre", "Ya existe un servicio con este nombre.");
                return View(servicioDto);
            }

            var servicio = _mapper.Map<Servicio>(servicioDto);
            servicio.Activo = true;

            await _unitOfWork.Servicios.AddAsync(servicio);
            await _unitOfWork.CommitAsync();

            TempData["Success"] = "Servicio creado exitosamente.";
            return RedirectToAction(nameof(Index));
        }

        return View(servicioDto);
    }

    // GET: Servicios/Edit/5
    public async Task<IActionResult> Edit(int id)
    {
        var servicio = await _unitOfWork.Servicios.GetByIdAsync(id);
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
            // Verificar que no exista otro servicio con el mismo nombre (excluyendo el actual)
            var existeNombre = await _unitOfWork.Servicios.GetAll()
                .AnyAsync(s => s.Nombre.ToLower() == servicioDto.Nombre.ToLower() && s.Id != id);

            if (existeNombre)
            {
                ModelState.AddModelError("Nombre", "Ya existe un servicio con este nombre.");
                return View(servicioDto);
            }

            var servicio = await _unitOfWork.Servicios.GetByIdAsync(id);
            if (servicio == null)
            {
                return NotFound();
            }

            _mapper.Map(servicioDto, servicio);
            _unitOfWork.Servicios.Update(servicio);
            await _unitOfWork.CommitAsync();

            TempData["Success"] = "Servicio actualizado exitosamente.";
            return RedirectToAction(nameof(Index));
        }

        return View(servicioDto);
    }

    // GET: Servicios/Delete/5
    public async Task<IActionResult> Delete(int id)
    {
        var servicio = await _unitOfWork.Servicios.GetAll()
            .Include(s => s.Citas)
            .FirstOrDefaultAsync(s => s.Id == id);

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
        var servicio = await _unitOfWork.Servicios.GetAll()
            .Include(s => s.Citas)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (servicio == null)
        {
            return NotFound();
        }

        // Verificar si tiene citas asociadas
        if (servicio.Citas.Any())
        {
            TempData["Error"] = "No se puede eliminar el servicio porque tiene citas asociadas. Puede desactivarlo en su lugar.";
            return RedirectToAction(nameof(Index));
        }

        _unitOfWork.Servicios.Remove(servicio);
        await _unitOfWork.CommitAsync();

        TempData["Success"] = "Servicio eliminado exitosamente.";
        return RedirectToAction(nameof(Index));
    }

    // POST: Servicios/ToggleActivo/5
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> ToggleActivo(int id)
    {
        var servicio = await _unitOfWork.Servicios.GetByIdAsync(id);
        if (servicio == null)
        {
            return NotFound();
        }

        servicio.Activo = !servicio.Activo;
        _unitOfWork.Servicios.Update(servicio);
        await _unitOfWork.CommitAsync();

        TempData["Success"] = servicio.Activo 
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
