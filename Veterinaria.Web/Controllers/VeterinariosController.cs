using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Veterinaria.Application.Interfaces;
using Veterinaria.Domain.Entities;
using Veterinaria.Web.Models.Dto;
using X.PagedList.Extensions;

namespace Veterinaria.Web.Controllers;

[Authorize(Roles = "Admin")]
public class VeterinariosController : Controller
{
    private readonly IVeterinarioService _veterinarioService;
    private readonly IMapper _mapper;

    public VeterinariosController(IVeterinarioService veterinarioService, IMapper mapper)
    {
        _veterinarioService = veterinarioService;
        _mapper = mapper;
    }

    // GET: Veterinarios
    public IActionResult Index(string? especialidad, string? q, int page = 1)
    {
        var veterinariosEntities = _veterinarioService.GetVeterinarios(especialidad, q);

        // Calcular citas de esta semana para cada veterinario
        var inicioSemana = DateTime.Today.AddDays(-(int)DateTime.Today.DayOfWeek);
        var finSemana = inicioSemana.AddDays(7);

        var veterinarios = veterinariosEntities.ToList();
        
        var veterinariosConCitas = veterinarios.Select(v => new VeterinarioConCitasViewModel
        {
            Veterinario = _mapper.Map<VeterinarioDto>(v),
            CitasEstaSemana = v.Citas.Count(c => c.FechaHora >= inicioSemana && c.FechaHora < finSemana)
        }).ToPagedList(page, 10);

        // Obtener lista de especialidades para el filtro
        var especialidades = _veterinarioService.GetEspecialidades();

        ViewBag.Especialidades = especialidades;
        ViewBag.CurrentFilter = q;
        ViewBag.CurrentEspecialidad = especialidad;

        return View(veterinariosConCitas);
    }

    // GET: Veterinarios/Details/5
    public async Task<IActionResult> Details(int id)
    {
        var veterinario = await _veterinarioService.GetVeterinarioWithCitasAsync(id);

        if (veterinario == null)
        {
            return NotFound();
        }

        var veterinarioDto = _mapper.Map<VeterinarioDto>(veterinario);
        
        // Citas de esta semana
        var inicioSemana = DateTime.Today.AddDays(-(int)DateTime.Today.DayOfWeek);
        var finSemana = inicioSemana.AddDays(7);
        
        ViewBag.CitasEstaSemana = veterinario.Citas
            .Where(c => c.FechaHora >= inicioSemana && c.FechaHora < finSemana)
            .OrderBy(c => c.FechaHora)
            .ToList();

        ViewBag.CitasProximas = veterinario.Citas
            .Where(c => c.FechaHora >= DateTime.Now && c.Estado != "Cancelada")
            .OrderBy(c => c.FechaHora)
            .Take(10)
            .ToList();

        return View(veterinarioDto);
    }

    // GET: Veterinarios/Create
    public IActionResult Create()
    {
        var veterinarioDto = new VeterinarioDto
        {
            HorarioInicio = new TimeSpan(8, 0, 0),
            HorarioFin = new TimeSpan(18, 0, 0),
            Activo = true
        };
        return View(veterinarioDto);
    }

    // POST: Veterinarios/Create
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(VeterinarioDto veterinarioDto)
    {
        if (ModelState.IsValid)
        {
            var veterinario = _mapper.Map<Veterinario>(veterinarioDto);
            veterinario.Activo = true;

            await _veterinarioService.AddVeterinarioAsync(veterinario);

            TempData["Success"] = "Veterinario creado exitosamente.";
            return RedirectToAction(nameof(Index));
        }

        return View(veterinarioDto);
    }

    // GET: Veterinarios/Edit/5
    public async Task<IActionResult> Edit(int id)
    {
        var veterinario = await _veterinarioService.GetVeterinarioByIdAsync(id);
        if (veterinario == null)
        {
            return NotFound();
        }

        var veterinarioDto = _mapper.Map<VeterinarioDto>(veterinario);
        return View(veterinarioDto);
    }

    // POST: Veterinarios/Edit/5
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Edit(int id, VeterinarioDto veterinarioDto)
    {
        if (id != veterinarioDto.Id)
        {
            return NotFound();
        }

        if (ModelState.IsValid)
        {
            var veterinario = await _veterinarioService.GetVeterinarioByIdAsync(id);
            if (veterinario == null)
            {
                return NotFound();
            }

            _mapper.Map(veterinarioDto, veterinario);
            await _veterinarioService.UpdateVeterinarioAsync(veterinario);

            TempData["Success"] = "Veterinario actualizado exitosamente.";
            return RedirectToAction(nameof(Index));
        }

        return View(veterinarioDto);
    }

    // GET: Veterinarios/Delete/5
    public async Task<IActionResult> Delete(int id)
    {
        var veterinario = await _veterinarioService.GetVeterinarioWithCitasAsync(id);

        if (veterinario == null)
        {
            return NotFound();
        }

        var veterinarioDto = _mapper.Map<VeterinarioDto>(veterinario);
        ViewBag.TieneCitas = veterinario.Citas.Any();
        return View(veterinarioDto);
    }

    // POST: Veterinarios/Delete/5
    [HttpPost, ActionName("Delete")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> DeleteConfirmed(int id)
    {
        var deleted = await _veterinarioService.DeleteVeterinarioAsync(id);

        if (!deleted)
        {
            var veterinario = await _veterinarioService.GetVeterinarioWithCitasAsync(id);
            if (veterinario == null) return NotFound();

            // Verificar si tiene citas asociadas
            if (veterinario.Citas.Any())
            {
                TempData["Error"] = "No se puede eliminar el veterinario porque tiene citas asociadas.";
                return RedirectToAction(nameof(Index));
            }
        }

        TempData["Success"] = "Veterinario eliminado exitosamente.";
        return RedirectToAction(nameof(Index));
    }
}

// ViewModel para mostrar veterinarios con cantidad de citas
public class VeterinarioConCitasViewModel
{
    public VeterinarioDto Veterinario { get; set; } = default!;
    public int CitasEstaSemana { get; set; }
}
