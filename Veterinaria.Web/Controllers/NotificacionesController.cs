using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Veterinaria.Application.Interfaces;
using Veterinaria.Domain.Contracts;
using Veterinaria.Domain.Entities;

namespace Veterinaria.Web.Controllers;

[Authorize]
public class NotificacionesController : Controller
{
    private readonly INotificacionService _notificacionService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly UserManager<ApplicationUser> _userManager;

    public NotificacionesController(
        INotificacionService notificacionService,
        IUnitOfWork unitOfWork,
        UserManager<ApplicationUser> userManager)
    {
        _notificacionService = notificacionService;
        _unitOfWork = unitOfWork;
        _userManager = userManager;
    }

    private async Task<Usuario?> GetCurrentUsuarioAsync()
    {
        var appUser = await _userManager.GetUserAsync(User);
        if (appUser == null) return null;

        return await _unitOfWork.Usuarios.GetAll()
            .FirstOrDefaultAsync(u => u.ApplicationUserId == appUser.Id);
    }

    // GET: Notificaciones
    public async Task<IActionResult> Index()
    {
        var usuario = await GetCurrentUsuarioAsync();
        if (usuario == null) return RedirectToAction("Login", "Account", new { area = "Identity" });

        var notificaciones = await _notificacionService.ObtenerNotificacionesUsuarioAsync(usuario.Id);
        ViewBag.NoLeidasCount = await _notificacionService.ContarNoLeidasAsync(usuario.Id);

        return View(notificaciones);
    }

    // GET: Notificaciones/ObtenerNoLeidas (API para el badge)
    [HttpGet]
    public async Task<IActionResult> ObtenerNoLeidas()
    {
        var usuario = await GetCurrentUsuarioAsync();
        if (usuario == null) return Json(new { count = 0 });

        var count = await _notificacionService.ContarNoLeidasAsync(usuario.Id);
        return Json(new { count });
    }

    // GET: Notificaciones/ObtenerRecientes (API para dropdown)
    [HttpGet]
    public async Task<IActionResult> ObtenerRecientes()
    {
        var usuario = await GetCurrentUsuarioAsync();
        if (usuario == null) return Json(new { notificaciones = new List<object>() });

        var notificaciones = await _notificacionService.ObtenerNotificacionesUsuarioAsync(usuario.Id);
        var recientes = notificaciones.Take(5).Select(n => new
        {
            id = n.Id,
            titulo = n.Titulo,
            mensaje = n.Mensaje,
            tipo = n.Tipo,
            icono = n.Icono ?? GetIconoByTipo(n.Tipo),
            urlAccion = n.UrlAccion,
            leida = n.Leida,
            fecha = n.FechaCreacion.ToString("dd/MM/yyyy HH:mm"),
            tiempoRelativo = ObtenerTiempoRelativo(n.FechaCreacion)
        });

        return Json(new { notificaciones = recientes });
    }

    // POST: Notificaciones/MarcarLeida/5
    [HttpPost]
    public async Task<IActionResult> MarcarLeida(int id)
    {
        var usuario = await GetCurrentUsuarioAsync();
        if (usuario == null) return Unauthorized();

        // Verificar que la notificación pertenezca al usuario
        var notificacion = await _unitOfWork.Notificaciones.GetByIdAsync(id);
        if (notificacion == null || notificacion.UsuarioId != usuario.Id)
            return NotFound();

        await _notificacionService.MarcarComoLeidaAsync(id);
        return Json(new { success = true });
    }

    // POST: Notificaciones/MarcarTodasLeidas
    [HttpPost]
    public async Task<IActionResult> MarcarTodasLeidas()
    {
        var usuario = await GetCurrentUsuarioAsync();
        if (usuario == null) return Unauthorized();

        await _notificacionService.MarcarTodasComoLeidasAsync(usuario.Id);
        return Json(new { success = true });
    }

    // POST: Notificaciones/Eliminar/5
    [HttpPost]
    public async Task<IActionResult> Eliminar(int id)
    {
        var usuario = await GetCurrentUsuarioAsync();
        if (usuario == null) return Unauthorized();

        var notificacion = await _unitOfWork.Notificaciones.GetByIdAsync(id);
        if (notificacion == null || notificacion.UsuarioId != usuario.Id)
            return NotFound();

        await _notificacionService.EliminarNotificacionAsync(id);

        if (Request.Headers["X-Requested-With"] == "XMLHttpRequest")
            return Json(new { success = true });

        return RedirectToAction(nameof(Index));
    }

    private string ObtenerTiempoRelativo(DateTime fecha)
    {
        var diferencia = DateTime.Now - fecha;

        if (diferencia.TotalMinutes < 1) return "Ahora mismo";
        if (diferencia.TotalMinutes < 60) return $"Hace {(int)diferencia.TotalMinutes} min";
        if (diferencia.TotalHours < 24) return $"Hace {(int)diferencia.TotalHours} horas";
        if (diferencia.TotalDays < 7) return $"Hace {(int)diferencia.TotalDays} días";
        
        return fecha.ToString("dd/MM/yyyy");
    }

    private string GetIconoByTipo(string tipo)
    {
        return tipo switch
        {
            "Success" => "bi-check-circle-fill",
            "Warning" => "bi-exclamation-triangle-fill",
            "Error" => "bi-x-circle-fill",
            _ => "bi-info-circle-fill"
        };
    }
}
