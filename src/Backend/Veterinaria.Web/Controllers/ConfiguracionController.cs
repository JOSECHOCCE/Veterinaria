using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.IO;
using System.Text.Json;
using System.Threading.Tasks;
using Veterinaria.Application.DTOs;
using Veterinaria.Application.Interfaces;

namespace Veterinaria.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ConfiguracionController : ControllerBase
{
    private static readonly string ConfigFilePath = Path.Combine(AppContext.BaseDirectory, "ConfiguracionClinica.json");
    private static readonly object FileLock = new();
    private readonly IAuditoriaService _auditoriaService;

    public ConfiguracionController(IAuditoriaService auditoriaService)
    {
        _auditoriaService = auditoriaService;
    }

    [HttpGet]
    public ActionResult<Response<ClinicaConfigDto>> GetConfiguracion()
    {
        var config = CargarConfiguracion();
        return Ok(Response<ClinicaConfigDto>.Ok(config, "Configuración recuperada correctamente."));
    }

    [Authorize(Roles = "Admin")]
    [HttpPut]
    public async Task<ActionResult<Response<ClinicaConfigDto>>> UpdateConfiguracion([FromBody] ClinicaConfigDto request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(Response<object>.Fail("Datos de configuración inválidos."));
        }

        GuardarConfiguracion(request);

        // Registrar auditoría de la actualización
        await _auditoriaService.RegistrarAccionAsync(
            "Actualizar Configuración",
            "Configuracion",
            "1",
            $"Se actualizó la configuración del negocio. Horario: {request.HoraApertura} - {request.HoraCierre}. Tolerancia: {request.TiempoToleranciaMinutos} min."
        );

        return Ok(Response<ClinicaConfigDto>.Ok(request, "Configuración del negocio guardada y aplicada exitosamente."));
    }

    private static ClinicaConfigDto CargarConfiguracion()
    {
        lock (FileLock)
        {
            try
            {
                if (System.IO.File.Exists(ConfigFilePath))
                {
                    var json = System.IO.File.ReadAllText(ConfigFilePath);
                    var config = JsonSerializer.Deserialize<ClinicaConfigDto>(json);
                    if (config != null) return config;
                }
            }
            catch
            {
                // Fallback al default en caso de error de lectura
            }

            // Valores por defecto si el archivo no existe o falla
            var defaultConfig = new ClinicaConfigDto
            {
                HoraApertura = "09:00",
                HoraCierre = "18:00",
                DiasHabiles = new int[] { 1, 2, 3, 4, 5, 6 }, // Lunes a Sábado
                TiempoToleranciaMinutos = 15,
                AnticipacionCancelacionHoras = 2
            };

            GuardarConfiguracion(defaultConfig);
            return defaultConfig;
        }
    }

    private static void GuardarConfiguracion(ClinicaConfigDto config)
    {
        lock (FileLock)
        {
            try
            {
                var options = new JsonSerializerOptions { WriteIndented = true };
                var json = JsonSerializer.Serialize(config, options);
                System.IO.File.WriteAllText(ConfigFilePath, json);
            }
            catch
            {
                // Manejo silencioso en caso de error
            }
        }
    }
}

public class ClinicaConfigDto
{
    public string HoraApertura { get; set; } = "09:00";
    public string HoraCierre { get; set; } = "18:00";
    public int[] DiasHabiles { get; set; } = new int[] { 1, 2, 3, 4, 5, 6 };
    public int TiempoToleranciaMinutos { get; set; } = 15;
    public int AnticipacionCancelacionHoras { get; set; } = 2;
}
