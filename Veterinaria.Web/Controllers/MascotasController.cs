using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using Veterinaria.Domain.Entities;
using Veterinaria.Application.Interfaces;
using Veterinaria.Web.Models.Dto;
using X.PagedList.Extensions;

namespace Veterinaria.Web.Controllers;

[Authorize(Roles = "Usuario,Admin")]
public class MascotasController : Controller
{
    private readonly IMascotaService _mascotaService;
    private readonly IMapper _mapper;

    public MascotasController(IMascotaService mascotaService, IMapper mapper)
    {
        _mascotaService = mascotaService;
        _mapper = mapper;
    }

    // GET: Mascotas
    public IActionResult Index(string? q, int page = 1)
    {
        var query = _mascotaService.GetActiveMascotasWithUsuariosQuery();

        if (!string.IsNullOrWhiteSpace(q))
        {
            q = q.ToLower();
            query = query.Where(m => m.Nombre.ToLower().Contains(q) ||
                                     m.Especie.ToLower().Contains(q));
        }

        var mascotas = query.OrderBy(m => m.Nombre)
            .Select(m => _mapper.Map<MascotaDto>(m))
            .ToPagedList(page, 10);

        ViewBag.CurrentFilter = q;
        return View(mascotas);
    }

    // GET: Mascotas/Details/5
    public async Task<IActionResult> Details(int id)
    {
        var mascota = await _mascotaService.GetMascotaWithDetailsAsync(id);

        if (mascota == null)
        {
            return NotFound();
        }

        var mascotaDto = _mapper.Map<MascotaDto>(mascota);
        ViewBag.Citas = mascota.Citas.OrderByDescending(c => c.FechaHora).ToList();

        return View(mascotaDto);
    }

    // GET: Mascotas/Create
    public async Task<IActionResult> Create()
    {
        await CargarUsuariosViewBag();
        return View(new MascotaDto());
    }

    // POST: Mascotas/Create
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(MascotaDto mascotaDto)
    {
        if (ModelState.IsValid)
        {
            var mascota = _mapper.Map<Mascota>(mascotaDto);
            mascota.Activo = true;
            
            // TODO: Obtener UsuarioId desde claims cuando se implemente autenticación
            if (mascota.UsuarioId == 0)
            {
                mascota.UsuarioId = 1; // Temporal
            }

            await _mascotaService.AddMascotaAsync(mascota);

            TempData["Success"] = "Mascota creada exitosamente.";
            return RedirectToAction(nameof(Index));
        }

        await CargarUsuariosViewBag();
        return View(mascotaDto);
    }

    // GET: Mascotas/Edit/5
    public async Task<IActionResult> Edit(int id)
    {
        var mascota = await _mascotaService.GetMascotaByIdAsync(id);
        if (mascota == null)
        {
            return NotFound();
        }

        var mascotaDto = _mapper.Map<MascotaDto>(mascota);
        await CargarUsuariosViewBag();
        return View(mascotaDto);
    }

    // POST: Mascotas/Edit/5
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Edit(int id, MascotaDto mascotaDto)
    {
        if (id != mascotaDto.Id)
        {
            return NotFound();
        }

        if (ModelState.IsValid)
        {
            var mascota = await _mascotaService.GetMascotaByIdAsync(id);
            if (mascota == null)
            {
                return NotFound();
            }

            _mapper.Map(mascotaDto, mascota);
            await _mascotaService.UpdateMascotaAsync(mascota);

            TempData["Success"] = "Mascota actualizada exitosamente.";
            return RedirectToAction(nameof(Index));
        }

        await CargarUsuariosViewBag();
        return View(mascotaDto);
    }

    // GET: Mascotas/Delete/5
    public async Task<IActionResult> Delete(int id)
    {
        var mascota = await _mascotaService.GetMascotaWithUsuarioAsync(id);

        if (mascota == null)
        {
            return NotFound();
        }

        var mascotaDto = _mapper.Map<MascotaDto>(mascota);
        return View(mascotaDto);
    }

    // POST: Mascotas/Delete/5
    [HttpPost, ActionName("Delete")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> DeleteConfirmed(int id)
    {
        var mascota = await _mascotaService.GetMascotaByIdAsync(id);
        if (mascota == null)
        {
            return NotFound();
        }

        await _mascotaService.DeleteMascotaAsync(id);

        TempData["Success"] = "Mascota eliminada exitosamente.";
        return RedirectToAction(nameof(Index));
    }

    private async Task CargarUsuariosViewBag()
    {
        var usuarios = await _mascotaService.GetActiveUsuariosAsync();

        ViewBag.Usuarios = new SelectList(usuarios, "Id", "Nombre");
    }
}
