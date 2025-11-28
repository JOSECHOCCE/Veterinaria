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
public class VeterinariosController : Controller
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public VeterinariosController(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    // GET: Veterinarios
    public IActionResult Index(string? especialidad, string? q, int page = 1)
    {
        var query = _unitOfWork.Veterinarios.GetAll()
            .Include(v => v.Citas)
            .Where(v => v.Activo)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(especialidad))
        {
            query = query.Where(v => v.Especialidad != null && v.Especialidad.ToLower().Contains(especialidad.ToLower()));
        }

        if (!string.IsNullOrWhiteSpace(q))
        {
            q = q.ToLower();
            query = query.Where(v => v.Nombre.ToLower().Contains(q) || 
                                     (v.Email != null && v.Email.ToLower().Contains(q)));
        }

        // Calcular citas de esta semana para cada veterinario
        var inicioSemana = DateTime.Today.AddDays(-(int)DateTime.Today.DayOfWeek);
        var finSemana = inicioSemana.AddDays(7);

        var veterinarios = query.OrderBy(v => v.Nombre).ToList();
        
        var veterinariosConCitas = veterinarios.Select(v => new VeterinarioConCitasViewModel
        {
            Veterinario = _mapper.Map<VeterinarioDto>(v),
            CitasEstaSemana = v.Citas.Count(c => c.FechaHora >= inicioSemana && c.FechaHora < finSemana)
        }).ToPagedList(page, 10);

        // Obtener lista de especialidades para el filtro
        var especialidades = _unitOfWork.Veterinarios.GetAll()
            .Where(v => v.Activo && v.Especialidad != null)
            .Select(v => v.Especialidad)
            .Distinct()
            .OrderBy(e => e)
            .ToList();

        ViewBag.Especialidades = especialidades;
        ViewBag.CurrentFilter = q;
        ViewBag.CurrentEspecialidad = especialidad;

        return View(veterinariosConCitas);
    }

    // GET: Veterinarios/Details/5
    public async Task<IActionResult> Details(int id)
    {
        var veterinario = await _unitOfWork.Veterinarios.GetAll()
            .Include(v => v.Citas)
                .ThenInclude(c => c.Mascota)
            .Include(v => v.Citas)
                .ThenInclude(c => c.Servicio)
            .FirstOrDefaultAsync(v => v.Id == id);

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

            await _unitOfWork.Veterinarios.AddAsync(veterinario);
            await _unitOfWork.CommitAsync();

            TempData["Success"] = "Veterinario creado exitosamente.";
            return RedirectToAction(nameof(Index));
        }

        return View(veterinarioDto);
    }

    // GET: Veterinarios/Edit/5
    public async Task<IActionResult> Edit(int id)
    {
        var veterinario = await _unitOfWork.Veterinarios.GetByIdAsync(id);
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
            var veterinario = await _unitOfWork.Veterinarios.GetByIdAsync(id);
            if (veterinario == null)
            {
                return NotFound();
            }

            _mapper.Map(veterinarioDto, veterinario);
            _unitOfWork.Veterinarios.Update(veterinario);
            await _unitOfWork.CommitAsync();

            TempData["Success"] = "Veterinario actualizado exitosamente.";
            return RedirectToAction(nameof(Index));
        }

        return View(veterinarioDto);
    }

    // GET: Veterinarios/Delete/5
    public async Task<IActionResult> Delete(int id)
    {
        var veterinario = await _unitOfWork.Veterinarios.GetAll()
            .Include(v => v.Citas)
            .FirstOrDefaultAsync(v => v.Id == id);

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
        var veterinario = await _unitOfWork.Veterinarios.GetAll()
            .Include(v => v.Citas)
            .FirstOrDefaultAsync(v => v.Id == id);

        if (veterinario == null)
        {
            return NotFound();
        }

        // Verificar si tiene citas asociadas
        if (veterinario.Citas.Any())
        {
            TempData["Error"] = "No se puede eliminar el veterinario porque tiene citas asociadas.";
            return RedirectToAction(nameof(Index));
        }

        _unitOfWork.Veterinarios.Remove(veterinario);
        await _unitOfWork.CommitAsync();

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
