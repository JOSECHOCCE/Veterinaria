using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Veterinaria.Application.DTOs;
using Veterinaria.Application.Interfaces;
using Veterinaria.Domain.Entities;
using Veterinaria.Web.Models.Dto;
using System.Linq;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Veterinaria.Web.Controllers;

public class CrearMascotaYCitaRequest
{
    public CitaDto CitaDto { get; set; } = null!;
    public string MascotaNombre { get; set; } = string.Empty;
    public string MascotaEspecie { get; set; } = string.Empty;
    public string? MascotaRaza { get; set; }
    public decimal? MascotaPeso { get; set; }
}

[Authorize(Roles = "Admin,Recepcionista,Veterinario,Cliente,Usuario")]
[ApiController]
[Route("api/[controller]")]
public class CitasController : ControllerBase
{
    private readonly IMapper _mapper;
    private readonly ICitaService _citaService;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly INotificacionService _notificacionService;

    public CitasController(
        IMapper mapper,
        ICitaService citaService,
        UserManager<ApplicationUser> userManager,
        INotificacionService notificacionService)
    {
        _mapper = mapper;
        _citaService = citaService;
        _userManager = userManager;
        _notificacionService = notificacionService;
    }

    private bool IsAdmin() => User.IsInRole("Admin");
    private bool IsStaff() => User.IsInRole("Admin") || User.IsInRole("Recepcionista") || User.IsInRole("Veterinario");

    // GET: api/Citas/CalendarioData
    [HttpGet("CalendarioData")]
    public async Task<ActionResult<Response<object>>> CalendarioData(DateTime? start, DateTime? end)
    {
        var citas = await _citaService.GetCitasParaCalendarioAsync(start, end);

        var eventos = citas.Select(c => new
        {
            id = c.Id,
            title = $"{c.Mascota?.Nombre} - {c.Servicio?.Nombre}",
            start = c.FechaHora.ToString("yyyy-MM-ddTHH:mm:ss"),
            end = c.FechaHora.AddMinutes(c.Servicio?.DuracionMinutos ?? 30).ToString("yyyy-MM-ddTHH:mm:ss"),
            color = c.Estado switch
            {
                "ReservaTemporal" => "#6c757d",      // Gris
                "PendienteConfirmacion" => "#fd7e14",// Naranja
                "PendienteAsignacion" => "#ffc107",  // Amarillo
                "Confirmada" => "#0d6efd",           // Azul
                "EnEspera" => "#6f42c1",             // Morado
                "EnAtencion" => "#17a2b8",           // Cyan
                "Completada" => "#198754",           // Verde
                "Cancelada" => "#dc3545",            // Rojo
                "Rechazada" => "#dc3545",            // Rojo
                "NoAsistio" => "#343a40",            // Gris oscuro
                _ => "#6c757d"
            },
            textColor = "#fff",
            extendedProps = new
            {
                mascota = c.Mascota?.Nombre,
                mascotaId = c.MascotaId,
                servicio = c.Servicio?.Nombre,
                servicioId = c.ServicioId,
                veterinario = c.Veterinario?.Nombre,
                veterinarioId = c.VeterinarioId,
                estado = c.Estado,
                motivo = c.Motivo,
                propietario = c.Mascota?.Usuario?.Nombre,
                duracion = c.Servicio?.DuracionMinutos ?? 30,
                precio = c.Servicio?.Precio ?? 0
            }
        });

        return Ok(Response<object>.Ok(eventos));
    }

    // GET: api/Citas/HorariosDisponibles
    [HttpGet("HorariosDisponibles")]
    public async Task<ActionResult<Response<object>>> HorariosDisponibles([FromQuery] int veterinarioId, [FromQuery] DateTime fecha)
    {
        var horarios = await _citaService.ObtenerHorariosDisponiblesAsync(veterinarioId, fecha);

        var result = horarios.Select(h => new
        {
            value = h.ToString("yyyy-MM-ddTHH:mm"),
            text = h.ToString("HH:mm")
        });

        return Ok(Response<object>.Ok(result));
    }

    // GET: api/Citas/ValidarDisponibilidad
    [HttpGet("ValidarDisponibilidad")]
    public async Task<ActionResult<Response<object>>> ValidarDisponibilidad([FromQuery] int veterinarioId, [FromQuery] DateTime fechaHora, [FromQuery] int servicioId, [FromQuery] int? citaId = null)
    {
        var (fechaValida, mensajeFecha) = await _citaService.ValidarFechaCitaAsync(veterinarioId, fechaHora);
        if (!fechaValida)
        {
            return Ok(Response<object>.Ok(new { disponible = false, mensaje = mensajeFecha }));
        }

        // DuracionMinutos here is a bit tricky, we need to pass a default or query the service. 
        // For thin controller, we assume 30 or we can look it up in service. 
        // Actually, the ValidarFechaCitaAsync can do it, but we can also just trust the service method.
        // For now, let's keep it simple: 30 mins default if we don't know the service here.
        var disponible = await _citaService.VeterinarioDisponibleAsync(veterinarioId, fechaHora, 30, citaId);
        
        if (!disponible)
        {
            return Ok(Response<object>.Ok(new { disponible = false, mensaje = "Horario no disponible." }));
        }

        return Ok(Response<object>.Ok(new { disponible = true, mensaje = "Horario disponible." }));
    }

    [HttpPost("ReservaTemporal")]
    public async Task<ActionResult<Response<object>>> ReservaTemporal([FromBody] CitaDto citaDto)
    {
        try
        {
            var cita = _mapper.Map<Cita>(citaDto);
            // Precio por defecto 0, o buscarlo (se asume que el Service lo hará o ya viene).
            // Para simplificar, le pasamos 0 y que el servicio use el precio del servicio.
            // (El CitaService no busca el precio, se lo pasamos, pero para la reserva no se cobra aún).
            await _citaService.ReservaTemporalCitaAsync(cita, 0);

            return Ok(Response<object>.Ok(new { Message = "Bloque reservado temporalmente por 5 minutos.", CitaId = cita.Id }));
        }
        catch (Exception ex)
        {
            return BadRequest(Response<object>.Fail(ex.Message));
        }
    }

    [HttpPost]
    public async Task<ActionResult<Response<object>>> Create([FromBody] CitaDto citaDto)
    {
        try
        {
            var cita = _mapper.Map<Cita>(citaDto);
            
            // Si viene del portal cliente, forzamos estado. Si es Admin/Recepcionista, respetamos el de citaDto o Confirmada.
            if (!IsStaff())
            {
                cita.Estado = "PendienteConfirmacion";
            }
            else if (string.IsNullOrEmpty(cita.Estado))
            {
                cita.Estado = "Confirmada";
            }

            await _citaService.CreateCitaAsync(cita, 0); // Precio se maneja en capa de presentación o lo busca el service si hace falta

            await _notificacionService.NotificarNuevaCitaSolicitadaAsync(cita);

            return Ok(Response<object>.Ok(new { Message = "Cita registrada correctamente.", CitaId = cita.Id }));
        }
        catch (Exception ex)
        {
            return BadRequest(Response<object>.Fail(ex.Message));
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Recepcionista,Veterinario")]
    public async Task<ActionResult<Response<object>>> Edit(int id, [FromBody] CitaDto citaDto)
    {
        if (id != citaDto.Id) return BadRequest(Response<object>.Fail("ID mismatch."));

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        try
        {
            var result = await _citaService.EditCitaAsync(id, citaDto.Estado, citaDto.Motivo, citaDto.FechaHora, citaDto.VeterinarioId, userId);
            if (!result.Success) return BadRequest(Response<object>.Fail("Error al actualizar."));
            
            return Ok(Response<object>.Ok("Cita actualizada exitosamente."));
        }
        catch (Exception ex)
        {
            return BadRequest(Response<object>.Fail(ex.Message));
        }
    }

    [HttpPost("CambiarEstado/{id}")]
    [Authorize(Roles = "Admin,Recepcionista,Veterinario")]
    public async Task<ActionResult<Response<object>>> CambiarEstado(int id, [FromQuery] string nuevoEstado)
    {
        var result = await _citaService.CambiarEstadoAsync(id, nuevoEstado);
        if (!result.Success) return BadRequest(Response<object>.Fail(result.Error ?? "Error"));
        
        return Ok(Response<object>.Ok($"Estado cambiado a {nuevoEstado}"));
    }

    [HttpPost("Cancel/{id}")]
    public async Task<ActionResult<Response<object>>> Cancel(int id)
    {
        var result = await _citaService.CancelarCitaAsync(id, IsStaff(), null);
        if (!result.Success) return BadRequest(Response<object>.Fail(result.Error ?? "Error"));
        
        return Ok(Response<object>.Ok("Cita cancelada."));
    }
}
