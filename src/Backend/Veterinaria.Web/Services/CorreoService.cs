using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Veterinaria.Application.Interfaces;

namespace Veterinaria.Web.Services;

public class CorreoService : ICorreoService
{
    private readonly ILogger<CorreoService> _logger;

    public CorreoService(ILogger<CorreoService> logger)
    {
        _logger = logger;
    }

    public Task EnviarCorreoAsync(string destinatario, string asunto, string cuerpo)
    {
        // En una implementación real, aquí se usaría SMTP o un proveedor como SendGrid
        _logger.LogInformation("=========================================");
        _logger.LogInformation($"[SIMULACIÓN DE CORREO] Enviando a: {destinatario}");
        _logger.LogInformation($"[ASUNTO]: {asunto}");
        _logger.LogInformation($"[CUERPO]: {cuerpo}");
        _logger.LogInformation("=========================================");
        
        return Task.CompletedTask;
    }
}
