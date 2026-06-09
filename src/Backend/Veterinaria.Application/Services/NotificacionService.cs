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
    private readonly ICorreoService _correoService;

    public NotificacionService(IUnitOfWork unitOfWork, IRealTimeNotificationService realTimeService, ICorreoService correoService)
    {
        _unitOfWork = unitOfWork;
        _realTimeService = realTimeService;
        _correoService = correoService;
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
        var usuario = await _unitOfWork.Usuarios.GetByIdAsync(mascota.UsuarioId);

        var titulo = "🎉 ¡Cita Confirmada!";
        var mensaje = $"Tu cita para {mascota.Nombre} ha sido confirmada para el {cita.FechaHora:dd/MM/yyyy} a las {cita.FechaHora:HH:mm}.";

        await CrearNotificacionAsync(
            mascota.UsuarioId,
            titulo,
            mensaje,
            "Success",
            "bi-calendar-check",
            "/cliente/mis-citas"
        );

        if (usuario != null && !string.IsNullOrEmpty(usuario.Email))
        {
            await _correoService.EnviarCorreoAsync(usuario.Email, titulo, mensaje);
        }
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
            "/cliente/mis-citas"
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
            "/cliente/mis-citas"
        );
    }

    public async Task NotificarCitaCanceladaAsync(Cita cita)
    {
        var mascota = await _unitOfWork.Mascotas.GetByIdAsync(cita.MascotaId);
        if (mascota == null) return;
        var usuario = await _unitOfWork.Usuarios.GetByIdAsync(mascota.UsuarioId);

        var titulo = "❌ Cita Cancelada";
        var mensaje = $"La cita de {mascota.Nombre} programada para el {cita.FechaHora:dd/MM/yyyy HH:mm} ha sido cancelada.";

        await CrearNotificacionAsync(
            mascota.UsuarioId,
            titulo,
            mensaje,
            "Warning",
            "bi-x-circle",
            "/cliente/mis-citas"
        );

        if (usuario != null && !string.IsNullOrEmpty(usuario.Email))
        {
            await _correoService.EnviarCorreoAsync(usuario.Email, titulo, mensaje);
        }
    }

    public async Task NotificarCitaRechazadaAsync(Cita cita)
    {
        var mascota = await _unitOfWork.Mascotas.GetByIdAsync(cita.MascotaId);
        if (mascota == null) return;
        var usuario = await _unitOfWork.Usuarios.GetByIdAsync(mascota.UsuarioId);

        var titulo = "⚠️ Solicitud de Cita Rechazada";
        var mensaje = $"Lo sentimos, la solicitud de cita para {mascota.Nombre} el {cita.FechaHora:dd/MM/yyyy HH:mm} no pudo ser agendada y fue rechazada por la clínica. Puedes intentar en otro horario.";

        await CrearNotificacionAsync(
            mascota.UsuarioId,
            titulo,
            mensaje,
            "Error",
            "bi-calendar-x",
            "/cliente/mis-citas"
        );

        if (usuario != null && !string.IsNullOrEmpty(usuario.Email))
        {
            await _correoService.EnviarCorreoAsync(usuario.Email, titulo, mensaje);
        }
    }

    public async Task NotificarCitaReprogramadaAsync(Cita cita)
    {
        var mascota = await _unitOfWork.Mascotas.GetByIdAsync(cita.MascotaId);
        if (mascota == null) return;
        var usuario = await _unitOfWork.Usuarios.GetByIdAsync(mascota.UsuarioId);

        var titulo = "🔄 Cita Reprogramada";
        var mensaje = $"La cita de {mascota.Nombre} ha sido reprogramada para el {cita.FechaHora:dd/MM/yyyy HH:mm}.";

        await CrearNotificacionAsync(
            mascota.UsuarioId,
            titulo,
            mensaje,
            "Info",
            "bi-calendar-event",
            "/cliente/mis-citas"
        );

        if (usuario != null && !string.IsNullOrEmpty(usuario.Email))
        {
            await _correoService.EnviarCorreoAsync(usuario.Email, titulo, mensaje);
        }
    }

    public async Task NotificarRecordatorioCitaAsync(Cita cita)
    {
        var mascota = await _unitOfWork.Mascotas.GetByIdAsync(cita.MascotaId);
        var veterinario = await _unitOfWork.Veterinarios.GetByIdAsync(cita.VeterinarioId);
        if (mascota == null) return;
        var usuario = await _unitOfWork.Usuarios.GetByIdAsync(mascota.UsuarioId);

        var titulo = "⏰ Recordatorio de Cita";
        var mensaje = $"Tienes una cita para {mascota.Nombre} mañana a las {cita.FechaHora:HH:mm} con Dr. {veterinario?.Nombre ?? ""}. ¡No olvides asistir!";

        await CrearNotificacionAsync(
            mascota.UsuarioId,
            titulo,
            mensaje,
            "Info",
            "bi-bell",
            "/cliente/mis-citas"
        );

        if (usuario != null && usuario.RecibirRecordatorios && !string.IsNullOrEmpty(usuario.Email))
        {
            await _correoService.EnviarCorreoAsync(usuario.Email, titulo, mensaje);
        }
    }

    public async Task NotificarProximoControlAsync(HistorialClinico atencion)
    {
        if (atencion.ProximoControl == null) return;
        var cita = await _unitOfWork.Citas.GetByIdAsync(atencion.CitaId);
        if (cita == null) return;
        var mascota = await _unitOfWork.Mascotas.GetByIdAsync(cita.MascotaId);
        if (mascota == null) return;
        var usuario = await _unitOfWork.Usuarios.GetByIdAsync(mascota.UsuarioId);

        var titulo = "🗓️ Sugerencia de Próximo Control";
        var mensaje = $"El próximo control sugerido para {mascota.Nombre} es alrededor del {atencion.ProximoControl.Value:dd/MM/yyyy}. Puedes agendar tu cita desde el portal.";

        await CrearNotificacionAsync(
            mascota.UsuarioId,
            titulo,
            mensaje,
            "Info",
            "bi-calendar-plus",
            "/cliente/nueva-cita"
        );

        if (usuario != null && usuario.RecibirRecordatorios && !string.IsNullOrEmpty(usuario.Email))
        {
            await _correoService.EnviarCorreoAsync(usuario.Email, titulo, mensaje);
        }
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
            "/cliente/mis-pagos"
        );
    }

    public async Task NotificarNuevaCitaSolicitadaAsync(Cita cita)
    {
        var mascota = await _unitOfWork.Mascotas.GetByIdAsync(cita.MascotaId);
        if (mascota == null) return;

        var cliente = await _unitOfWork.Usuarios.GetByIdAsync(mascota.UsuarioId);
        var nombreCliente = cliente?.Nombre ?? "Cliente";

        // Obtener todos los Recepcionistas y Admins
        var personal = await _unitOfWork.Usuarios.GetAll()
            .Where(u => u.Activo && (u.Rol == "Recepcionista" || u.Rol == "Admin"))
            .ToListAsync();

        foreach (var p in personal)
        {
            await CrearNotificacionAsync(
                p.Id,
                "📅 Nueva Cita Solicitada",
                $"El cliente {nombreCliente} ha solicitado una cita para {mascota.Nombre} el {cita.FechaHora:dd/MM/yyyy HH:mm}.",
                "Info",
                "bi-calendar-plus",
                $"/admin/agenda" // URL de la Agenda
            );
        }
    }

    public async Task ProcesarAlertasDiariasAsync()
    {
        var ahora = DateTime.Now;
        var manana = ahora.AddDays(1).Date;
        var pasadoManana = ahora.AddDays(2).Date;

        // 1. Recordatorios 24h antes (Citas Confirmadas para mañana)
        var citasManana = await _unitOfWork.Citas.GetAll()
            .Where(c => c.Estado == "Confirmada" && c.FechaHora.Date == manana)
            .ToListAsync();

        foreach (var cita in citasManana)
        {
            await NotificarRecordatorioCitaAsync(cita);
        }

        // 2. Citas próximas a vencer sin confirmación (para personal)
        var citasPendientesPorVencer = await _unitOfWork.Citas.GetAll()
            .Where(c => c.Estado == "Pendiente de confirmación" && c.FechaHora <= pasadoManana)
            .ToListAsync();

        var personal = await _unitOfWork.Usuarios.GetAll()
            .Where(u => u.Activo && (u.Rol == "Recepcionista" || u.Rol == "Admin"))
            .ToListAsync();

        foreach (var cita in citasPendientesPorVencer)
        {
            foreach (var p in personal)
            {
                await CrearNotificacionAsync(
                    p.Id,
                    "⚠️ Cita Pendiente por Vencer",
                    $"Una cita solicitada para el {cita.FechaHora:dd/MM/yyyy HH:mm} sigue sin confirmación.",
                    "Warning",
                    "bi-exclamation-triangle",
                    "/admin/agenda"
                );
            }
        }

        // 3. Citas con pago pendiente de más de 3 días (para personal)
        var hace3Dias = ahora.AddDays(-3);
        var pagosPendientes = await _unitOfWork.Citas.GetAll()
            .Where(c => c.Estado == "Completada" && c.EstadoPago != "Pagado" && c.FechaHora <= hace3Dias)
            .ToListAsync();

        foreach (var cita in pagosPendientes)
        {
            foreach (var p in personal)
            {
                await CrearNotificacionAsync(
                    p.Id,
                    "💸 Pago Pendiente Retrasado",
                    $"La cita del {cita.FechaHora:dd/MM/yyyy} tiene un pago pendiente de S/. {(cita.MontoTotal - cita.MontoPagado):N2}.",
                    "Warning",
                    "bi-cash",
                    "/admin/pagos"
                );
            }
        }

        // 4. Próximo control sugerido (Atenciones cuyo ProximoControl es en 3 días)
        var enTresDias = ahora.AddDays(3).Date;
        var atencionesParaControl = await _unitOfWork.HistorialesClinicos.GetAll()
            .Where(a => a.ProximoControl != null && a.ProximoControl.Value.Date == enTresDias)
            .ToListAsync();

        foreach (var atencion in atencionesParaControl)
        {
            await NotificarProximoControlAsync(atencion);
        }
    }
}
