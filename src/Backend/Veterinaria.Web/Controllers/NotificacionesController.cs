using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Veterinaria.Application.Interfaces;
using Veterinaria.Domain.Contracts;
using Veterinaria.Domain.Entities;
using Veterinaria.Application.DTOs;

namespace Veterinaria.Web.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class NotificacionesController : ControllerBase
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

    [HttpGet]
    public async Task<ActionResult<Response<object>>> Index()
    {
        var usuario = await GetCurrentUsuarioAsync();
        if (usuario == null) return Unauthorized(Response<object>.Fail("No autorizado"));

        var notificaciones = await _notificacionService.ObtenerNotificacionesUsuarioAsync(usuario.Id);
        var noLeidasCount = await _notificacionService.ContarNoLeidasAsync(usuario.Id);

        return Ok(Response<object>.Ok(new { Notificaciones = notificaciones, NoLeidasCount = noLeidasCount }));
    }

    [HttpGet("ObtenerNoLeidas")]
    public async Task<ActionResult<Response<object>>> ObtenerNoLeidas()
    {
        var usuario = await GetCurrentUsuarioAsync();
        if (usuario == null) return Unauthorized(Response<object>.Fail("No autorizado"));

        var count = await _notificacionService.ContarNoLeidasAsync(usuario.Id);
        return Ok(Response<object>.Ok(new { count }));
    }

    [HttpGet("ObtenerRecientes")]
    public async Task<ActionResult<Response<object>>> ObtenerRecientes()
    {
        var usuario = await GetCurrentUsuarioAsync();
        if (usuario == null) return Unauthorized(Response<object>.Fail("No autorizado"));

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

        return Ok(Response<object>.Ok(new { notificaciones = recientes }));
    }

    [HttpPost("MarcarLeida/{id}")]
    public async Task<ActionResult<Response<object>>> MarcarLeida(int id)
    {
        var usuario = await GetCurrentUsuarioAsync();
        if (usuario == null) return Unauthorized(Response<object>.Fail("No autorizado"));

        var notificacion = await _unitOfWork.Notificaciones.GetByIdAsync(id);
        if (notificacion == null || notificacion.UsuarioId != usuario.Id)
            return NotFound(Response<object>.Fail("Notificación no encontrada"));

        await _notificacionService.MarcarComoLeidaAsync(id);
        return Ok(Response<object>.Ok(new { success = true }));
    }

    [HttpPost("MarcarTodasLeidas")]
    public async Task<ActionResult<Response<object>>> MarcarTodasLeidas()
    {
        var usuario = await GetCurrentUsuarioAsync();
        if (usuario == null) return Unauthorized(Response<object>.Fail("No autorizado"));

        await _notificacionService.MarcarTodasComoLeidasAsync(usuario.Id);
        return Ok(Response<object>.Ok(new { success = true }));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<Response<object>>> Eliminar(int id)
    {
        var usuario = await GetCurrentUsuarioAsync();
        if (usuario == null) return Unauthorized(Response<object>.Fail("No autorizado"));

        var notificacion = await _unitOfWork.Notificaciones.GetByIdAsync(id);
        if (notificacion == null || notificacion.UsuarioId != usuario.Id)
            return NotFound(Response<object>.Fail("Notificación no encontrada"));

        await _notificacionService.EliminarNotificacionAsync(id);

        return Ok(Response<object>.Ok(new { success = true }));
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
