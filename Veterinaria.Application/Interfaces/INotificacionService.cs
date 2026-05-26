using System.Collections.Generic;
using System.Threading.Tasks;
using Veterinaria.Domain.Entities;

namespace Veterinaria.Application.Interfaces;

public interface INotificacionService
{
    Task<Notificacion> CrearNotificacionAsync(int usuarioId, string titulo, string mensaje, string tipo = "Info", string? icono = null, string? urlAccion = null);
    Task<List<Notificacion>> ObtenerNotificacionesUsuarioAsync(int usuarioId, bool soloNoLeidas = false);
    Task<int> ContarNoLeidasAsync(int usuarioId);
    Task MarcarComoLeidaAsync(int notificacionId);
    Task MarcarTodasComoLeidasAsync(int usuarioId);
    Task EliminarNotificacionAsync(int notificacionId);
    
    // Notificaciones específicas del negocio
    Task NotificarCitaConfirmadaAsync(Cita cita);
    Task NotificarCitaEnProcesoAsync(Cita cita);
    Task NotificarCitaCompletadaAsync(Cita cita);
    Task NotificarCitaCanceladaAsync(Cita cita);
    Task NotificarRecordatorioCitaAsync(Cita cita);
    Task NotificarPagoRecibidoAsync(Cita cita, decimal monto);
}
