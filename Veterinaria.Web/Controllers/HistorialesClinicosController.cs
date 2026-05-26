using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Veterinaria.Application.Interfaces;
using Veterinaria.Domain.Entities;
using Veterinaria.Web.Models.Dto;
using X.PagedList.Extensions;

namespace Veterinaria.Web.Controllers;

[Authorize(Roles = "Usuario,Admin")]
public class HistorialesClinicosController : Controller
{
    private readonly IHistorialClinicoService _historialService;
    private readonly IMapper _mapper;

    public HistorialesClinicosController(IHistorialClinicoService historialService, IMapper mapper)
    {
        _historialService = historialService;
        _mapper = mapper;
    }

    // GET: HistorialesClinicos/Index?mascotaId=1
    public async Task<IActionResult> Index(int mascotaId, int page = 1)
    {
        // Obtener la mascota para mostrar información
        var mascota = await _historialService.GetMascotaWithUsuarioAsync(mascotaId);

        if (mascota == null)
        {
            TempData["Error"] = "Mascota no encontrada.";
            return RedirectToAction("Index", "Mascotas");
        }

        // Obtener todos los historiales de las citas de esta mascota
        var historiales = await _historialService.GetHistorialesByMascotaIdAsync(mascotaId);

        var historialesDto = _mapper.Map<List<HistorialClinicoDto>>(historiales);

        // Agregar información adicional de la cita a cada DTO
        for (int i = 0; i < historiales.Count; i++)
        {
            historialesDto[i].VeterinarioNombre = historiales[i].Cita.Veterinario?.Nombre;
            historialesDto[i].ServicioNombre = historiales[i].Cita.Servicio?.Nombre;
            historialesDto[i].FechaCita = historiales[i].Cita.FechaHora;
        }

        ViewBag.Mascota = mascota;
        ViewBag.MascotaId = mascotaId;

        return View(historialesDto.ToPagedList(page, 10));
    }

    // GET: HistorialesClinicos/Create?citaId=1
    public async Task<IActionResult> Create(int citaId)
    {
        // Verificar que la cita existe y está completada
        var cita = await _historialService.GetCitaForHistorialAsync(citaId);

        if (cita == null)
        {
            TempData["Error"] = "Cita no encontrada.";
            return RedirectToAction("Index", "Citas");
        }

        if (cita.Estado != "Completada")
        {
            TempData["Error"] = "Solo se puede crear historial clínico para citas completadas.";
            return RedirectToAction("Details", "Citas", new { id = citaId });
        }

        // Verificar que no exista ya un historial para esta cita
        var historialExistente = await _historialService.ExistsHistorialForCitaAsync(citaId);

        if (historialExistente)
        {
            TempData["Error"] = "Ya existe un historial clínico para esta cita.";
            return RedirectToAction("Details", new { citaId = citaId });
        }

        var historialDto = new HistorialClinicoDto
        {
            CitaId = citaId,
            FechaRegistro = DateTime.Now
        };

        ViewBag.Cita = cita;

        return View(historialDto);
    }

    // POST: HistorialesClinicos/Create
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(HistorialClinicoDto historialDto)
    {
        // Verificar que la cita existe y está completada
        var cita = await _historialService.GetCitaForHistorialAsync(historialDto.CitaId);

        if (cita == null)
        {
            TempData["Error"] = "Cita no encontrada.";
            return RedirectToAction("Index", "Citas");
        }

        if (cita.Estado != "Completada")
        {
            ModelState.AddModelError("", "Solo se puede crear historial clínico para citas completadas.");
            ViewBag.Cita = cita;
            return View(historialDto);
        }

        // Verificar que no exista ya un historial para esta cita
        var historialExistente = await _historialService.ExistsHistorialForCitaAsync(historialDto.CitaId);

        if (historialExistente)
        {
            TempData["Error"] = "Ya existe un historial clínico para esta cita.";
            return RedirectToAction("Details", new { citaId = historialDto.CitaId });
        }

        if (!ModelState.IsValid)
        {
            ViewBag.Cita = cita;
            return View(historialDto);
        }

        var historial = _mapper.Map<HistorialClinico>(historialDto);
        historial.FechaRegistro = DateTime.Now;

        await _historialService.AddHistorialAsync(historial);

        TempData["Success"] = "Historial clínico creado exitosamente.";
        return RedirectToAction("Details", new { citaId = historial.CitaId });
    }

    // GET: HistorialesClinicos/Details?citaId=1
    public async Task<IActionResult> Details(int citaId)
    {
        var historial = await _historialService.GetHistorialByCitaIdAsync(citaId);

        if (historial == null)
        {
            TempData["Error"] = "Historial clínico no encontrado para esta cita.";
            return RedirectToAction("Details", "Citas", new { id = citaId });
        }

        var historialDto = _mapper.Map<HistorialClinicoDto>(historial);

        // Agregar información de la cita
        historialDto.VeterinarioNombre = historial.Cita.Veterinario?.Nombre;
        historialDto.ServicioNombre = historial.Cita.Servicio?.Nombre;
        historialDto.FechaCita = historial.Cita.FechaHora;
        historialDto.MotivoCita = historial.Cita.Motivo;

        ViewBag.Mascota = historial.Cita.Mascota;
        ViewBag.Veterinario = historial.Cita.Veterinario;
        ViewBag.Servicio = historial.Cita.Servicio;
        ViewBag.Cita = historial.Cita;

        return View(historialDto);
    }

    // GET: HistorialesClinicos/Edit/5
    public async Task<IActionResult> Edit(int id)
    {
        var historial = await _historialService.GetHistorialByIdAsync(id);

        if (historial == null)
        {
            TempData["Error"] = "Historial clínico no encontrado.";
            return RedirectToAction("Index", "Citas");
        }

        var historialDto = _mapper.Map<HistorialClinicoDto>(historial);
        ViewBag.Cita = historial.Cita;

        return View(historialDto);
    }

    // POST: HistorialesClinicos/Edit/5
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Edit(int id, HistorialClinicoDto historialDto)
    {
        if (id != historialDto.Id)
        {
            return NotFound();
        }

        var historialExistente = await _historialService.GetHistorialByIdAsync(id);

        if (historialExistente == null)
        {
            TempData["Error"] = "Historial clínico no encontrado.";
            return RedirectToAction("Index", "Citas");
        }

        if (!ModelState.IsValid)
        {
            ViewBag.Cita = historialExistente.Cita;
            return View(historialDto);
        }

        // Actualizar solo los campos editables
        historialExistente.Diagnostico = historialDto.Diagnostico;
        historialExistente.Tratamiento = historialDto.Tratamiento;
        historialExistente.Medicamentos = historialDto.Medicamentos;
        historialExistente.Observaciones = historialDto.Observaciones;

        await _historialService.UpdateHistorialAsync(historialExistente);

        TempData["Success"] = "Historial clínico actualizado exitosamente.";
        return RedirectToAction("Details", new { citaId = historialExistente.CitaId });
    }

    // GET: HistorialesClinicos/DescargarPDF?citaId=1
    public async Task<IActionResult> DescargarPDF(int citaId)
    {
        var historial = await _historialService.GetHistorialByCitaIdAsync(citaId);

        if (historial == null)
        {
            TempData["Error"] = "Historial clínico no encontrado.";
            return RedirectToAction("Index", "Citas");
        }

        // TODO: Implementar generación de PDF
        // Por ahora, mostrar mensaje de placeholder
        TempData["Info"] = "La funcionalidad de descarga de PDF será implementada próximamente.";
        return RedirectToAction("Details", new { citaId = citaId });
    }
}
