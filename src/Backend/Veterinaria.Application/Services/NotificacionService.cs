using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Veterinaria.Application.Interfaces;
using Veterinaria.Domain.Contracts;
using Veterinaria.Domain.Entities;

namespace Veterinaria.Application.Services;

public class NotificacionService : INotificacionService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IRealTimeNotificationService _realTimeService;

    public NotificacionService(IUnitOfWork unitOfWork, IRealTimeNotificationService realTimeService)
    {
        _unitOfWork = unitOfWork;
        _realTimeService = realTimeService;
    }

    public async Task<Notificacion> CrearNotificacionAsync(int usuarioId, string titulo, string mensaje, string tipo = "Info", string? icono = null, string? urlAccion = null)
    {
        var notificacion = new Notificacion
        {
            UsuarioId = usuarioId,
            Titulo = titulo,
            Mensaje = mensaje,
            Tipo = tipo,
            Icono = icono,
            UrlAccion = urlAccion,
            FechaCreacion = DateTime.Now
        };

        await _unitOfWork.Notificaciones.AddAsync(notificacion);
        await _unitOfWork.CommitAsync();

        // Obtener el ApplicationUserId del usuario para enviar notificacion en tiempo real
        var usuario = await _unitOfWork.Usuarios.GetByIdAsync(usuarioId);
        if (usuario?.ApplicationUserId != null)
        {
            await _realTimeService.SendNotificationAsync(usuario.ApplicationUserId, new
            {
                id = notificacion.Id,
                titulo = notificacion.Titulo,
                mensaje = notificacion.Mensaje,
                tipo = notificacion.Tipo,
                icono = notificacion.Icono,
                urlAccion = notificacion.UrlAccion,
                fecha = notificacion.FechaCreacion.ToString("dd/MM/yyyy HH:mm")
            });
        }

        return notificacion;
    }

    public async Task<List<Notificacion>> ObtenerNotificacionesUsuarioAsync(int usuarioId, bool soloNoLeidas = false)
    {
        var query = _unitOfWork.Notificaciones.GetAll()
            .Where(n => n.UsuarioId == usuarioId);

        if (soloNoLeidas)
            query = query.Where(n => !n.Leida);

        return await query
            .OrderByDescending(n => n.FechaCreacion)
            .Take(50) // Limitar a las últimas 50
            .ToListAsync();
    }

    public async Task<int> ContarNoLeidasAsync(int usuarioId)
    {
        return await _unitOfWork.Notificaciones.GetAll()
            .CountAsync(n => n.UsuarioId == usuarioId && !n.Leida);
    }

    public async Task MarcarComoLeidaAsync(int notificacionId)
    {
        var notificacion = await _unitOfWork.Notificaciones.GetByIdAsync(notificacionId);
        if (notificacion != null && !notificacion.Leida)
        {
            notificacion.Leida = true;
            notificacion.FechaLectura = DateTime.Now;
            _unitOfWork.Notificaciones.Update(notificacion);
            await _unitOfWork.CommitAsync();
        }
    }

    public async Task MarcarTodasComoLeidasAsync(int usuarioId)
    {
        var notificaciones = await _unitOfWork.Notificaciones.GetAll()
            .Where(n => n.UsuarioId == usuarioId && !n.Leida)
            .ToListAsync();

        foreach (var notificacion in notificaciones)
        {
            notificacion.Leida = true;
            notificacion.FechaLectura = DateTime.Now;
            _unitOfWork.Notificaciones.Update(notificacion);
        }

        await _unitOfWork.CommitAsync();
    }

    public async Task EliminarNotificacionAsync(int notificacionId)
    {
        var notificacion = await _unitOfWork.Notificaciones.GetByIdAsync(notificacionId);
        if (notificacion != null)
        {
            _unitOfWork.Notificaciones.Remove(notificacion);
            await _unitOfWork.CommitAsync();
        }
    }

    // === Notificaciones específicas del negocio ===

    public async Task NotificarCitaConfirmadaAsync(Cita cita)
    {
        var mascota = await _unitOfWork.Mascotas.GetByIdAsync(cita.MascotaId);
        if (mascota == null) return;

        await CrearNotificacionAsync(
            mascota.UsuarioId,
            "🎉 ¡Cita Confirmada!",
            $"Tu cita para {mascota.Nombre} ha sido confirmada para el {cita.FechaHora:dddd dd 'de' MMMM} a las {cita.FechaHora:HH:mm}.",
            "Success",
            "bi-calendar-check",
            $"/Citas/Details/{cita.Id}"
        );
    }

    public async Task NotificarCitaEnProcesoAsync(Cita cita)
    {
        var mascota = await _unitOfWork.Mascotas.GetByIdAsync(cita.MascotaId);
        var servicio = await _unitOfWork.Servicios.GetByIdAsync(cita.ServicioId);
        if (mascota == null) return;

        await CrearNotificacionAsync(
            mascota.UsuarioId,
            "🏥 Tu mascota está siendo atendida",
            $"¡{mascota.Nombre} está en consulta! El servicio de {servicio?.Nombre ?? "atención"} está en proceso. Te notificaremos cuando termine.",
            "Info",
            "bi-heart-pulse",
            $"/Citas/Details/{cita.Id}"
        );
    }

    public async Task NotificarCitaCompletadaAsync(Cita cita)
    {
        var mascota = await _unitOfWork.Mascotas.GetByIdAsync(cita.MascotaId);
        if (mascota == null) return;

        var mensajePago = cita.EstadoPago == "Parcial" 
            ? $" Recuerda que tienes un saldo pendiente de S/. {(cita.MontoTotal - cita.MontoPagado):N2}."
            : "";

        await CrearNotificacionAsync(
            mascota.UsuarioId,
            "✅ ¡Cita Completada! Pasa a recoger a tu mascota",
            $"¡{mascota.Nombre} ya está listo/a! La atención ha finalizado exitosamente. Puedes pasar a recogerlo/a.{mensajePago}",
            "Success",
            "bi-check-circle-fill",
            $"/Citas/Details/{cita.Id}"
        );
    }

    public async Task NotificarCitaCanceladaAsync(Cita cita)
    {
        var mascota = await _unitOfWork.Mascotas.GetByIdAsync(cita.MascotaId);
        if (mascota == null) return;

        await CrearNotificacionAsync(
            mascota.UsuarioId,
            "❌ Cita Cancelada",
            $"La cita de {mascota.Nombre} programada para el {cita.FechaHora:dd/MM/yyyy HH:mm} ha sido cancelada.",
            "Warning",
            "bi-x-circle",
            "/Citas"
        );
    }

    public async Task NotificarRecordatorioCitaAsync(Cita cita)
    {
        var mascota = await _unitOfWork.Mascotas.GetByIdAsync(cita.MascotaId);
        var veterinario = await _unitOfWork.Veterinarios.GetByIdAsync(cita.VeterinarioId);
        if (mascota == null) return;

        await CrearNotificacionAsync(
            mascota.UsuarioId,
            "⏰ Recordatorio de Cita",
            $"Tienes una cita para {mascota.Nombre} mañana a las {cita.FechaHora:HH:mm} con Dr. {veterinario?.Nombre ?? ""}. ¡No olvides asistir!",
            "Info",
            "bi-bell",
            $"/Citas/Details/{cita.Id}"
        );
    }

    public async Task NotificarPagoRecibidoAsync(Cita cita, decimal monto)
    {
        var mascota = await _unitOfWork.Mascotas.GetByIdAsync(cita.MascotaId);
        if (mascota == null) return;

        var mensaje = cita.EstadoPago == "Pagado"
            ? $"Hemos recibido tu pago de S/. {monto:N2} para la cita de {mascota.Nombre}. ¡Gracias!"
            : $"Hemos recibido tu pago parcial de S/. {monto:N2}. Saldo pendiente: S/. {(cita.MontoTotal - cita.MontoPagado):N2}";

        await CrearNotificacionAsync(
            mascota.UsuarioId,
            "💰 Pago Recibido",
            mensaje,
            "Success",
            "bi-credit-card-2-front",
            $"/Citas/Details/{cita.Id}"
        );
    }
}
