using Microsoft.EntityFrameworkCore;
using Veterinaria.Infrastructure.Persistence;

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
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<VeterinariaDbContext>();

        var ahora = DateTime.Now;

        // 1. Citas pendientes que ya pasaron hace más de 30 minutos -> Marcar como "NoAsistio"
        var citasNoAsistidas = await context.Citas
            .Where(c => c.Estado == "Pendiente" || c.Estado == "Confirmada")
            .Where(c => c.FechaHora < ahora.AddMinutes(-30))
            .ToListAsync();

        foreach (var cita in citasNoAsistidas)
        {
            cita.Estado = "NoAsistio";
            _logger.LogInformation($"Cita {cita.Id} marcada como NoAsistio");
        }

        // 2. Citas "EnProceso" que llevan más de 4 horas -> Completar automáticamente
        var citasEnProcesoLargo = await context.Citas
            .Where(c => c.Estado == "EnProceso")
            .Where(c => c.FechaHora < ahora.AddHours(-4))
            .ToListAsync();

        foreach (var cita in citasEnProcesoLargo)
        {
            cita.Estado = "Completada";
            _logger.LogInformation($"Cita {cita.Id} completada automáticamente");
        }

        if (citasNoAsistidas.Any() || citasEnProcesoLargo.Any())
        {
            await context.SaveChangesAsync();
            _logger.LogInformation($"Estados actualizados: {citasNoAsistidas.Count} no asistidas, {citasEnProcesoLargo.Count} completadas");
        }
    }
}
