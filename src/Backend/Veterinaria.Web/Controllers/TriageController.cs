using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Veterinaria.Application.Interfaces;
using Veterinaria.Domain.Entities;
using Veterinaria.Application.DTOs;
using System.Linq;
using System.Threading.Tasks;
using System;

namespace Veterinaria.Web.Controllers;

[Authorize(Roles = "Admin,Recepcionista,Veterinario")]
[ApiController]
[Route("api/[controller]")]
public class TriageController : ControllerBase
{
    private readonly ITriageService _triageService;
    private readonly ICitaService _citaService;
    private readonly INotificacionService _notificacionService;

    public TriageController(
        ITriageService triageService,
        ICitaService citaService,
        INotificacionService notificacionService)
    {
        _triageService = triageService;
        _citaService = citaService;
        _notificacionService = notificacionService;
    }

    [HttpGet("Cola")]
    public async Task<ActionResult<Response<object>>> Cola()
    {
        var triages = await _triageService.GetColaTriageAsync();

        var triagesMapped = triages.Select(t => new
        {
            id = t.Id,
            citaId = t.CitaId,
            mascotaId = t.MascotaId,
            mascotaNombre = t.Mascota?.Nombre ?? "Mascota",
            propietarioNombre = t.Mascota?.Usuario?.Nombre ?? "Propietario",
            nivel = t.Nivel,
            prioridadColor = t.PrioridadColor,
            estado = t.Estado,
            motivoConsulta = t.MotivoConsulta,
            temperatura = t.Temperatura ?? 0,
            frecuenciaCardiaca = t.FrecuenciaCardiaca ?? 0,
            peso = t.PesoEstimado ?? 0,
            tiempoEsperaEstimadoMin = t.TiempoEsperaEstimadoMin,
            consultorio = t.Consultorio,
            fechaRegistro = t.FechaRegistro.ToString("yyyy-MM-ddTHH:mm:ss")
        }).ToList();

        var result = new
        {
            Triages = triagesMapped,
            TotalEsperando = triages.Count(t => t.Estado == "EnEspera"),
            TotalEmergencias = triages.Count(t => t.Nivel == "N1")
        };

        return Ok(Response<object>.Ok(result));
    }

    [HttpPost]
    public async Task<ActionResult<Response<object>>> Create([FromBody] Triage triage)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(Response<object>.Fail("Datos inválidos."));
        }

        // Asignar color y tiempo estimado según nivel
        switch (triage.Nivel)
        {
            case "N1":
                triage.PrioridadColor = "Rojo";
                triage.TiempoEsperaEstimadoMin = 0;
                triage.Consultorio = "Sala de Shock";
                break;
            case "N2":
                triage.PrioridadColor = "Naranja";
                triage.TiempoEsperaEstimadoMin = 15;
                triage.Consultorio = "Consultorio 1";
                break;
            default: // N3
                triage.PrioridadColor = "Verde";
                triage.TiempoEsperaEstimadoMin = 30;
                triage.Consultorio = "En Espera";
                break;
        }

        triage.Estado = "EnEspera";
        triage.FechaRegistro = DateTime.Now;

        await _triageService.AddTriageAsync(triage);

        return Ok(Response<object>.Ok("Paciente registrado en la cola de atención."));
    }

    [HttpPost("CambiarEstado/{id}")]
    public async Task<ActionResult<Response<object>>> CambiarEstado(int id, [FromQuery] string nuevoEstado)
    {
        var triage = await _triageService.GetTriageByIdAsync(id);
        if (triage == null) return NotFound(Response<object>.Fail("Triage no encontrado."));

        triage.Estado = nuevoEstado;
        await _triageService.UpdateTriageAsync(triage);

        // Si el estado es EnAtencion y existe cita asociada, pasar la cita a EnProceso y notificar al cliente.
        if (nuevoEstado == "EnAtencion" && triage.CitaId.HasValue)
        {
            var result = await _citaService.CambiarEstadoAsync(triage.CitaId.Value, "EnAtencion");
            if (result.Success && result.Cita != null)
            {
                await _notificacionService.NotificarCitaEnProcesoAsync(result.Cita);
            }
        }

        return Ok(Response<object>.Ok("Estado actualizado."));
    }

    [HttpGet("Mascotas")]
    public async Task<ActionResult<Response<object>>> Mascotas()
    {
        var mascotas = await _triageService.GetMascotasActivasConUsuarioAsync();

        var result = mascotas.Select(m => new { 
            m.Id, 
            Display = $"{m.Nombre} ({m.Especie}) - {m.Usuario?.Nombre}" 
        }).ToList();

        return Ok(Response<object>.Ok(result));
    }
}
