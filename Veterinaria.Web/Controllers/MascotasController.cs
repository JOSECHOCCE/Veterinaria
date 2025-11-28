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

[Authorize(Roles = "Usuario,Admin")]
public class MascotasController : Controller
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public MascotasController(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    // GET: Mascotas
    public IActionResult Index(string? q, int page = 1)
    {
        var query = _unitOfWork.Mascotas.GetAll()
            .Include(m => m.Usuario)
            .Where(m => m.Activo)
            .AsQueryable();

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
        var mascota = await _unitOfWork.Mascotas.GetAll()
            .Include(m => m.Usuario)
            .Include(m => m.Citas)
                .ThenInclude(c => c.Servicio)
            .Include(m => m.Citas)
                .ThenInclude(c => c.Veterinario)
            .FirstOrDefaultAsync(m => m.Id == id);

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

            await _unitOfWork.Mascotas.AddAsync(mascota);
            await _unitOfWork.CommitAsync();

            TempData["Success"] = "Mascota creada exitosamente.";
            return RedirectToAction(nameof(Index));
        }

        await CargarUsuariosViewBag();
        return View(mascotaDto);
    }

    // GET: Mascotas/Edit/5
    public async Task<IActionResult> Edit(int id)
    {
        var mascota = await _unitOfWork.Mascotas.GetByIdAsync(id);
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
            var mascota = await _unitOfWork.Mascotas.GetByIdAsync(id);
            if (mascota == null)
            {
                return NotFound();
            }

            _mapper.Map(mascotaDto, mascota);
            _unitOfWork.Mascotas.Update(mascota);
            await _unitOfWork.CommitAsync();

            TempData["Success"] = "Mascota actualizada exitosamente.";
            return RedirectToAction(nameof(Index));
        }

        await CargarUsuariosViewBag();
        return View(mascotaDto);
    }

    // GET: Mascotas/Delete/5
    public async Task<IActionResult> Delete(int id)
    {
        var mascota = await _unitOfWork.Mascotas.GetAll()
            .Include(m => m.Usuario)
            .FirstOrDefaultAsync(m => m.Id == id);

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
        var mascota = await _unitOfWork.Mascotas.GetByIdAsync(id);
        if (mascota == null)
        {
            return NotFound();
        }

        _unitOfWork.Mascotas.Remove(mascota);
        await _unitOfWork.CommitAsync();

        TempData["Success"] = "Mascota eliminada exitosamente.";
        return RedirectToAction(nameof(Index));
    }

    private async Task CargarUsuariosViewBag()
    {
        var usuarios = await _unitOfWork.Usuarios.GetAll()
            .Where(u => u.Activo)
            .OrderBy(u => u.Nombre)
            .ToListAsync();

        ViewBag.Usuarios = new SelectList(usuarios, "Id", "Nombre");
    }
}
