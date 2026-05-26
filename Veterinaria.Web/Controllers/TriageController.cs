using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Veterinaria.Application.Interfaces;
using Veterinaria.Domain.Entities;

namespace Veterinaria.Web.Controllers;

[Authorize(Roles = "Admin")]
public class TriageController : Controller
{
    private readonly ITriageService _triageService;

    public TriageController(ITriageService triageService)
    {
        _triageService = triageService;
    }

    // GET: Triage/Cola - Cola de atención
    public async Task<IActionResult> Cola()
    {
        var triages = await _triageService.GetColaTriageAsync();

        ViewBag.TotalEsperando = triages.Count(t => t.Estado == "EnEspera");
        ViewBag.TotalEmergencias = triages.Count(t => t.Nivel == "N1");

        return View(triages);
    }

    // GET: Triage/Create
    public async Task<IActionResult> Create(int? mascotaId)
    {
        await CargarMascotasViewBag();
        var triage = new Triage();
        if (mascotaId.HasValue) triage.MascotaId = mascotaId.Value;
        return View(triage);
    }

    // POST: Triage/Create
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(Triage triage)
    {
        if (ModelState.IsValid)
        {
            // Asignar color y tiempo estimado según nivel
            switch (triage.Nivel)
            {
                case "N1":
                    triage.PrioridadColor = "Rojo";
                    triage.TiempoEsperaEstimadoMin = 0;
                    triage.Consultorio = "Sala de Shock";
                    break;
                case "N2":
                    triage.PrioridadColor = "Naranja";
                    triage.TiempoEsperaEstimadoMin = 15;
                    triage.Consultorio = "Consultorio 1";
                    break;
                default: // N3
                    triage.PrioridadColor = "Verde";
                    triage.TiempoEsperaEstimadoMin = 30;
                    triage.Consultorio = "En Espera";
                    break;
            }

            triage.Estado = "EnEspera";
            triage.FechaRegistro = DateTime.Now;

            await _triageService.AddTriageAsync(triage);

            TempData["Success"] = "Paciente registrado en la cola de atención.";
            return RedirectToAction(nameof(Cola));
        }

        await CargarMascotasViewBag();
        return View(triage);
    }

    // POST: Triage/CambiarEstado
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> CambiarEstado(int id, string nuevoEstado)
    {
        var triage = await _triageService.GetTriageByIdAsync(id);
        if (triage == null) return NotFound();

        triage.Estado = nuevoEstado;
        await _triageService.UpdateTriageAsync(triage);

        TempData["Success"] = "Estado actualizado.";
        return RedirectToAction(nameof(Cola));
    }

    private async Task CargarMascotasViewBag()
    {
        var mascotas = await _triageService.GetMascotasActivasConUsuarioAsync();

        ViewBag.Mascotas = new SelectList(
            mascotas.Select(m => new { m.Id, Display = $"{m.Nombre} ({m.Especie}) - {m.Usuario?.Nombre}" }),
            "Id", "Display");
    }
}
