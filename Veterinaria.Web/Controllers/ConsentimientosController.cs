using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Veterinaria.Application.Interfaces;
using Veterinaria.Domain.Entities;

namespace Veterinaria.Web.Controllers;

[Authorize]
public class ConsentimientosController : Controller
{
    private readonly IConsentimientoService _consentimientoService;

    public ConsentimientosController(IConsentimientoService consentimientoService)
    {
        _consentimientoService = consentimientoService;
    }

    // GET: Consentimientos
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Index(int? usuarioId)
    {
        var consentimientos = await _consentimientoService.GetConsentimientosAsync(usuarioId);

        return View(consentimientos);
    }

    // GET: Consentimientos/Create
    public IActionResult Create(int? mascotaId, string? tipo)
    {
        var consentimiento = new Consentimiento
        {
            DocumentoId = $"FRM-{DateTime.Now:yyyy}-{new Random().Next(100, 999)}",
            TipoConsentimiento = tipo ?? "Anestesia General y Cirugía"
        };

        if (mascotaId.HasValue) consentimiento.MascotaId = mascotaId;

        return View(consentimiento);
    }

    // POST: Consentimientos/Create
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(Consentimiento consentimiento)
    {
        if (ModelState.IsValid)
        {
            // Get current user's Usuario record
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var usuario = await _consentimientoService.GetUsuarioByApplicationUserIdAsync(userId);

            if (usuario == null)
            {
                TempData["Error"] = "Usuario no encontrado.";
                return View(consentimiento);
            }

            consentimiento.UsuarioId = usuario.Id;
            consentimiento.IpOrigen = HttpContext.Connection.RemoteIpAddress?.ToString();
            consentimiento.FechaCreacion = DateTime.Now;

            if (consentimiento.Aceptado)
            {
                consentimiento.FechaAceptacion = DateTime.Now;
            }

            await _consentimientoService.AddConsentimientoAsync(consentimiento);

            TempData["Success"] = "Consentimiento registrado exitosamente.";
            return RedirectToAction(nameof(Index));
        }

        return View(consentimiento);
    }

    // GET: Consentimientos/Details/5
    public async Task<IActionResult> Details(int id)
    {
        var consentimiento = await _consentimientoService.GetConsentimientoByIdAsync(id);

        if (consentimiento == null) return NotFound();

        return View(consentimiento);
    }
}
