using Microsoft.EntityFrameworkCore;
using Veterinaria.Application.Interfaces;
using Veterinaria.Infrastructure.Persistence;

using Microsoft.Extensions.DependencyInjection;

namespace Veterinaria.Web.Services;

/// <summary>
/// Servicio para actualizar automáticamente los estados de las citas
/// </summary>
public class CitaStatusService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<CitaStatusService> _logger;

    public CitaStatusService(IServiceProvider serviceProvider, ILogger<CitaStatusService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Servicio de actualización de estados de citas iniciado.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ActualizarEstadosCitas();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al actualizar estados de citas");
            }

            // Ejecutar cada 5 minutos
            await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
        }
    }

    private async Task ActualizarEstadosCitas()
    {
        await using var scope = _serviceProvider.CreateAsyncScope();
        var context = scope.ServiceProvider.GetRequiredService<VeterinariaDbContext>();
        var notificacionService = scope.ServiceProvider.GetRequiredService<INotificacionService>();

        var ahora = DateTime.Now;

        // 0. PASO 2.5 (RF-38) Recordatorio 24h antes: notificar a las citas Confirmadas
        // que ocurran dentro de las próximas 23-25h. Se deduplica buscando si ya existe
        // una Notificacion con UrlAccion apuntando a esa cita y título de Recordatorio.
        var ventanaInicio = ahora.AddHours(23);
        var ventanaFin = ahora.AddHours(25);
        var citasParaRecordar = await context.Citas
            .Include(c => c.Mascota)
            .Where(c => c.Estado == "Confirmada"
                     && c.FechaHora >= ventanaInicio
                     && c.FechaHora <= ventanaFin)
            .ToListAsync();

        foreach (var cita in citasParaRecordar)
        {
            try
            {
                var url = $"/Citas/Details/{cita.Id}";
                var yaEnviado = await context.Notificaciones
                    .AnyAsync(n => n.UrlAccion == url && n.Titulo.Contains("Recordatorio"));
                if (yaEnviado) continue;

                await notificacionService.NotificarRecordatorioCitaAsync(cita);
                _logger.LogInformation($"Recordatorio 24h enviado para cita {cita.Id}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error enviando recordatorio para cita {cita.Id}");
            }
        }

        // 1. Citas pendientes que ya pasaron hace más de 30 minutos -> Marcar como "NoAsistio"
        var citasNoAsistidas = await context.Citas
            .Where(c => c.Estado == "Solicitada" || c.Estado == "Pendiente" || c.Estado == "Confirmada" || c.Estado == "EnEspera")
            .Where(c => c.FechaHora < ahora.AddMinutes(-30))
            .ToListAsync();

        foreach (var cita in citasNoAsistidas)
        {
            cita.Estado = "NoAsistio";
            _logger.LogInformation($"Cita {cita.Id} marcada como NoAsistio");
        }

        // 2. Citas "EnProceso" que llevan más de 4 horas -> Completar automáticamente
        var citasEnProcesoLargo = await context.Citas
            .Where(c => c.Estado == "EnProceso" || c.Estado == "EnAtencion")
            .Where(c => c.FechaHora < ahora.AddHours(-4))
            .ToListAsync();

        foreach (var cita in citasEnProcesoLargo)
        {
            cita.Estado = "Completada";
            _logger.LogInformation($"Cita {cita.Id} completada automáticamente");
        }

        // 3. Reservas temporales expiradas -> Eliminar para liberar el índice único y el bloque horario
        var ahoraUtc = DateTime.UtcNow;
        var reservasExpiradas = await context.Citas
            .Where(c => c.Estado == "ReservaTemporal" 
                     && c.FechaExpiracionReserva.HasValue 
                     && c.FechaExpiracionReserva.Value < ahoraUtc)
            .ToListAsync();

        if (reservasExpiradas.Any())
        {
            context.Citas.RemoveRange(reservasExpiradas);
            _logger.LogInformation($"Eliminadas {reservasExpiradas.Count} reservas temporales expiradas.");
        }

        if (citasNoAsistidas.Any() || citasEnProcesoLargo.Any() || reservasExpiradas.Any())
        {
            await context.SaveChangesAsync();
            _logger.LogInformation($"Estados actualizados: {citasNoAsistidas.Count} no asistidas, {citasEnProcesoLargo.Count} completadas, {reservasExpiradas.Count} reservas temporales eliminadas.");
        }
    }
}
