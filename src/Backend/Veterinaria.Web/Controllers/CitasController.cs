using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Veterinaria.Application.DTOs;
using Veterinaria.Application.Interfaces;
using Veterinaria.Domain.Contracts;
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

[Authorize(Roles = "Usuario,Admin")]
[ApiController]
[Route("api/[controller]")]
public class CitasController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly ICitaService _citaService;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly INotificacionService _notificacionService;

    public CitasController(
        IUnitOfWork unitOfWork,
        IMapper mapper,
        ICitaService citaService,
        UserManager<ApplicationUser> userManager,
        INotificacionService notificacionService)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _citaService = citaService;
        _userManager = userManager;
        _notificacionService = notificacionService;
    }

    private async Task<Usuario?> GetCurrentUsuarioAsync()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return null;

        return await _unitOfWork.Usuarios.GetAll()
            .FirstOrDefaultAsync(u => u.ApplicationUserId == userId);
    }

    private bool IsAdmin() => User.IsInRole("Admin");

    // GET: api/Citas/CalendarioData
    [HttpGet("CalendarioData")]
    public async Task<ActionResult<Response<object>>> CalendarioData(DateTime? start, DateTime? end)
    {
        var fechaInicio = start ?? DateTime.Today.AddMonths(-1);
        var fechaFin = end ?? DateTime.Today.AddMonths(2);

        var citas = await _citaService.GetCitasParaCalendarioAsync(start, end);

        var eventos = citas.Select(c => new
        {
            id = c.Id,
            title = $"{c.Mascota?.Nombre} - {c.Servicio?.Nombre}",
            start = c.FechaHora.ToString("yyyy-MM-ddTHH:mm:ss"),
            end = c.FechaHora.AddMinutes(c.Servicio?.DuracionMinutos ?? 30).ToString("yyyy-MM-ddTHH:mm:ss"),
            color = c.Estado switch
            {
                "Pendiente" => "#ffc107",    // Amarillo
                "Confirmada" => "#0d6efd",   // Azul
                "EnProceso" => "#17a2b8",    // Cyan
                "Completada" => "#198754",   // Verde
                "Cancelada" => "#dc3545",    // Rojo
                _ => "#6c757d"               // Gris
            },
            textColor = c.Estado == "Pendiente" ? "#000" : "#fff",
            extendedProps = new
            {
                mascota = c.Mascota?.Nombre,
                servicio = c.Servicio?.Nombre,
                veterinario = c.Veterinario?.Nombre,
                estado = c.Estado,
                motivo = c.Motivo,
                propietario = c.Mascota?.Usuario?.Nombre,
                duracion = c.Servicio?.DuracionMinutos ?? 30,
                precio = c.Servicio?.Precio ?? 0
            }
        });

        return Ok(Response<object>.Ok(eventos));
    }

    // GET: api/Citas
    [HttpGet]
    public async Task<ActionResult<Response<object>>> Index(string? estado, int? veterinarioId, DateTime? fechaDesde, DateTime? fechaHasta, int page = 1)
    {
        int? currentUsuarioId = null;
        if (!IsAdmin())
        {
            var currentUser = await GetCurrentUsuarioAsync();
            if (currentUser != null)
                currentUsuarioId = currentUser.Id;
            else
                currentUsuarioId = -1; // No profile
        }

        var query = _citaService.GetCitasQuery(IsAdmin(), currentUsuarioId, estado, veterinarioId, fechaDesde, fechaHasta);

        var citasAll = query.OrderByDescending(c => c.FechaHora).ToList();
        var citasCount = citasAll.Count;
        var citasPaged = citasAll
            .Skip((page - 1) * 15)
            .Take(15)
            .Select(c => _mapper.Map<CitaDto>(c))
            .ToList();

        var veterinarios = _unitOfWork.Veterinarios.GetAll().Where(v => v.Activo).OrderBy(v => v.Nombre).ToList();

        var data = new
        {
            Citas = citasPaged,
            TotalCount = citasCount,
            Page = page,
            PageSize = 15,
            Estados = new[] { "Pendiente", "Confirmada", "EnProceso", "Completada", "Cancelada" },
            Veterinarios = veterinarios.Select(v => new { v.Id, v.Nombre }),
            CurrentEstado = estado,
            CurrentVeterinarioId = veterinarioId,
            CurrentFechaDesde = fechaDesde?.ToString("yyyy-MM-dd"),
            CurrentFechaHasta = fechaHasta?.ToString("yyyy-MM-dd"),
            EsAdmin = IsAdmin()
        };

        return Ok(Response<object>.Ok(data));
    }

    // GET: api/Citas/5
    [HttpGet("{id}")]
    public async Task<ActionResult<Response<object>>> Details(int id)
    {
        int? currentUsuarioId = null;
        if (!IsAdmin())
        {
            var currentUsuario = await GetCurrentUsuarioAsync();
            currentUsuarioId = currentUsuario?.Id;
        }

        var cita = await _citaService.GetCitaDetailsAsync(id, IsAdmin(), currentUsuarioId);

        if (cita == null)
        {
            var exists = await _unitOfWork.Citas.GetByIdAsync(id) != null;
            if (exists && !IsAdmin()) return StatusCode(403, Response<object>.Fail("No autorizado."));
            return NotFound(Response<object>.Fail("Cita no encontrada."));
        }

        var citaDto = _mapper.Map<CitaDto>(cita);
        var currentUser = await GetCurrentUsuarioAsync();

        var data = new
        {
            Cita = citaDto,
            TieneHistorial = cita.Historial != null,
            TienePago = cita.Pagos?.Any() ?? false,
            EsAdmin = IsAdmin(),
            PropietarioNombre = cita.Mascota?.Usuario?.Nombre,
            EsPropietario = currentUser != null && cita.Mascota?.UsuarioId == currentUser.Id,
            EstadoPago = cita.EstadoPago ?? "Pendiente",
            MontoTotal = cita.MontoTotal > 0 ? cita.MontoTotal : cita.Servicio?.Precio ?? 0,
            MontoPagado = cita.MontoPagado,
            TipoPago = cita.TipoPago,
            Pagos = cita.Pagos?.OrderByDescending(p => p.FechaPago).ToList() ?? new List<Pago>()
        };

        return Ok(Response<object>.Ok(data));
    }

    // GET: api/Citas/GetEstado/5
    [HttpGet("GetEstado/{id}")]
    public async Task<ActionResult<Response<object>>> GetEstado(int id)
    {
        int? currentUsuarioId = null;
        if (!IsAdmin())
        {
            var currentUsuario = await GetCurrentUsuarioAsync();
            currentUsuarioId = currentUsuario?.Id;
        }

        var cita = await _citaService.GetCitaDetailsAsync(id, IsAdmin(), currentUsuarioId);

        if (cita == null)
        {
            var exists = await _unitOfWork.Citas.GetByIdAsync(id) != null;
            if (exists && !IsAdmin()) return StatusCode(403, Response<object>.Fail("No autorizado."));
            return NotFound(Response<object>.Fail("Cita no encontrada."));
        }

        return Ok(Response<object>.Ok(new
        {
            estado = cita.Estado,
            fechaActualizacion = DateTime.Now.ToString("dd/MM/yyyy HH:mm:ss")
        }));
    }

    private async Task<dynamic> ObtenerDatosSelectsAsync(int? usuarioId = null)
    {
        IEnumerable<Mascota> mascotas;
        if (IsAdmin() || usuarioId == null)
        {
            mascotas = await _unitOfWork.Mascotas.GetAll()
                .Include(m => m.Usuario)
                .Where(m => m.Activo)
                .OrderBy(m => m.Nombre)
                .ToListAsync();
        }
        else
        {
            mascotas = await _unitOfWork.Mascotas.GetAll()
                .Include(m => m.Usuario)
                .Where(m => m.Activo && m.UsuarioId == usuarioId)
                .OrderBy(m => m.Nombre)
                .ToListAsync();
        }

        var veterinarios = await _unitOfWork.Veterinarios.GetAll()
            .Where(v => v.Activo)
            .OrderBy(v => v.Nombre)
            .ToListAsync();

        var servicios = await _unitOfWork.Servicios.GetAll()
            .Where(s => s.Activo)
            .OrderBy(s => s.Nombre)
            .ToListAsync();

        return new
        {
            Mascotas = mascotas.Select(m => new { m.Id, m.Nombre, m.Especie, m.Raza }),
            Veterinarios = veterinarios.Select(v => new { v.Id, v.Nombre }),
            Servicios = servicios.Select(s => new
            {
                Id = s.Id,
                NombreConPrecio = $"{s.Nombre} - S/. {s.Precio:N2}"
            })
        };
    }

    // GET: api/Citas/CreateTemplate
    [HttpGet("CreateTemplate")]
    public async Task<ActionResult<Response<object>>> GetCreateTemplate(int? mascotaId)
    {
        var currentUsuario = await GetCurrentUsuarioAsync();

        if (!IsAdmin() && currentUsuario == null)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var userEmail = User.FindFirstValue(ClaimTypes.Email);
            var userName = User.Identity?.Name ?? userEmail;

            currentUsuario = new Usuario
            {
                Nombre = userName ?? "Usuario",
                Email = userEmail ?? "",
                ApplicationUserId = userId,
                FechaRegistro = DateTime.Now,
                Activo = true
            };

            await _unitOfWork.Usuarios.AddAsync(currentUsuario);
            await _unitOfWork.CommitAsync();
        }

        var dataSelects = await ObtenerDatosSelectsAsync(currentUsuario?.Id);

        var citaDto = new CitaDto
        {
            FechaHora = DateTime.Now.AddDays(1).Date.AddHours(9),
            Estado = "Pendiente"
        };

        if (mascotaId.HasValue)
        {
            citaDto.MascotaId = mascotaId.Value;
        }

        var tieneMascotas = currentUsuario != null &&
            await _unitOfWork.Mascotas.GetAll()
                .AnyAsync(m => m.UsuarioId == currentUsuario.Id && m.Activo);

        var data = new
        {
            Cita = citaDto,
            TieneMascotas = tieneMascotas,
            UsuarioId = currentUsuario?.Id,
            EsAdmin = IsAdmin(),
            Mascotas = dataSelects.Mascotas,
            Veterinarios = dataSelects.Veterinarios,
            Servicios = dataSelects.Servicios
        };

        return Ok(Response<object>.Ok(data));
    }

    // POST: api/Citas/CrearMascotaYCita
    [HttpPost("CrearMascotaYCita")]
    public async Task<ActionResult<Response<object>>> CrearMascotaYCita([FromBody] CrearMascotaYCitaRequest request)
    {
        var currentUsuario = await GetCurrentUsuarioAsync();

        if (currentUsuario == null)
        {
            return Unauthorized(Response<object>.Fail("Debe iniciar sesión para agendar una cita."));
        }

        if (string.IsNullOrWhiteSpace(request.MascotaNombre) || string.IsNullOrWhiteSpace(request.MascotaEspecie))
        {
            return BadRequest(Response<object>.Fail("Debe completar el nombre y especie de la mascota."));
        }

        var mascota = new Mascota
        {
            Nombre = request.MascotaNombre,
            Especie = request.MascotaEspecie,
            Raza = request.MascotaRaza,
            Peso = request.MascotaPeso,
            UsuarioId = currentUsuario.Id,
            Activo = true
        };

        await _unitOfWork.Mascotas.AddAsync(mascota);
        await _unitOfWork.CommitAsync();

        request.CitaDto.MascotaId = mascota.Id;

        var servicio = await _unitOfWork.Servicios.GetByIdAsync(request.CitaDto.ServicioId);
        if (servicio == null)
        {
            return BadRequest(Response<object>.Fail("Servicio no encontrado."));
        }

        var (fechaValida, mensajeFecha) = await _citaService.ValidarFechaCitaAsync(
            request.CitaDto.VeterinarioId, request.CitaDto.FechaHora);

        if (!fechaValida)
        {
            return BadRequest(Response<object>.Fail(mensajeFecha ?? "Fecha inválida."));
        }

        var veterinarioDisponible = await _citaService.VeterinarioDisponibleAsync(
            request.CitaDto.VeterinarioId, request.CitaDto.FechaHora, servicio.DuracionMinutos, null);

        if (!veterinarioDisponible)
        {
            return BadRequest(Response<object>.Fail("El veterinario no está disponible en ese horario."));
        }

        var cita = _mapper.Map<Cita>(request.CitaDto);
        await _citaService.CreateCitaAsync(cita, servicio.Precio);

        return Ok(Response<object>.Ok(new {
            Message = $"Mascota '{mascota.Nombre}' registrada. Ahora proceda a realizar el pago para confirmar la cita.",
            CitaId = cita.Id
        }));
    }

    // POST: api/Citas
    [HttpPost]
    public async Task<ActionResult<Response<object>>> Create([FromBody] CitaDto citaDto)
    {
        if (ModelState.IsValid)
        {
            var servicio = await _unitOfWork.Servicios.GetByIdAsync(citaDto.ServicioId);
            if (servicio == null)
            {
                return BadRequest(Response<object>.Fail("Servicio no encontrado."));
            }

            var (fechaValida, mensajeFecha) = await _citaService.ValidarFechaCitaAsync(
                citaDto.VeterinarioId, citaDto.FechaHora);

            if (!fechaValida)
            {
                return BadRequest(Response<object>.Fail(mensajeFecha ?? "Fecha inválida."));
            }

            var veterinarioDisponible = await _citaService.VeterinarioDisponibleAsync(
                citaDto.VeterinarioId,
                citaDto.FechaHora,
                servicio.DuracionMinutos,
                citaDto.Id > 0 ? citaDto.Id : null);

            if (!veterinarioDisponible)
            {
                var horariosDisponibles = await _citaService.ObtenerHorariosDisponiblesAsync(
                    citaDto.VeterinarioId, citaDto.FechaHora.Date);

                var sugerencia = horariosDisponibles.Any()
                    ? $" Horarios disponibles: {string.Join(", ", horariosDisponibles.Take(5).Select(h => h.ToString("HH:mm")))}"
                    : " No hay horarios disponibles para esta fecha.";

                return BadRequest(Response<object>.Fail($"El veterinario no está disponible en ese horario.{sugerencia}"));
            }

            var tienePagosPendientes = await _citaService.MascotaTienePagosPendientesAsync(citaDto.MascotaId);
            if (tienePagosPendientes)
            {
                return BadRequest(Response<object>.Fail("La mascota tiene pagos pendientes. Por favor, liquide las deudas antes de agendar una nueva cita."));
            }

            var cita = _mapper.Map<Cita>(citaDto);
            await _citaService.CreateCitaAsync(cita, servicio.Precio);

            return Ok(Response<object>.Ok(new {
                Message = "¡Cita creada! Ahora proceda a realizar el pago para confirmarla.",
                CitaId = cita.Id
            }));
        }

        return BadRequest(Response<object>.Fail("Modelo inválido."));
    }

    // GET: api/Citas/Edit/5
    [HttpGet("Edit/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Response<object>>> Edit(int id)
    {
        var cita = await _citaService.GetCitaByIdAsync(id);
        if (cita == null)
        {
            return NotFound(Response<object>.Fail("Cita no encontrada."));
        }

        var citaDto = _mapper.Map<CitaDto>(cita);
        var data = new
        {
            Cita = citaDto,
            Estados = new[] { "Pendiente", "Confirmada", "EnProceso", "Completada", "Cancelada" }
        };

        return Ok(Response<object>.Ok(data));
    }

    // PUT: api/Citas/5
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Response<object>>> Edit(int id, [FromBody] CitaDto citaDto)
    {
        if (id != citaDto.Id)
        {
            return BadRequest(Response<object>.Fail("ID mismatch."));
        }

        if (ModelState.IsValid)
        {
            var citaOld = await _citaService.GetCitaByIdAsync(id);
            if (citaOld == null) return NotFound(Response<object>.Fail("Cita no encontrada."));
            var estadoAnterior = citaOld.Estado;

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var result = await _citaService.EditCitaAsync(id, citaDto.Estado, citaDto.Motivo, citaDto.FechaHora, citaDto.VeterinarioId, userId);
            if (!result.Success || result.Cita == null) return NotFound(Response<object>.Fail("Error al actualizar la cita."));

            if (estadoAnterior != citaDto.Estado)
            {
                await EnviarNotificacionCambioEstadoAsync(result.Cita);
            }

            return Ok(Response<object>.Ok("Cita actualizada exitosamente."));
        }

        return BadRequest(Response<object>.Fail("Modelo inválido."));
    }

    // POST: api/Citas/Cancel/5
    [HttpPost("Cancel/{id}")]
    public async Task<ActionResult<Response<object>>> Cancel(int id)
    {
        int? currentUsuarioId = null;
        if (!IsAdmin())
        {
            var currentUser = await GetCurrentUsuarioAsync();
            currentUsuarioId = currentUser?.Id;
        }

        var result = await _citaService.CancelarCitaAsync(id, IsAdmin(), currentUsuarioId);

        if (!result.Success)
        {
            if (result.Error == "No encontrado") return NotFound(Response<object>.Fail("Cita no encontrada."));
            if (result.Error == "Forbid") return StatusCode(403, Response<object>.Fail("No autorizado."));
            
            return BadRequest(Response<object>.Fail(result.Error ?? "Error desconocido."));
        }

        if (result.Cita != null)
        {
            await _notificacionService.NotificarCitaCanceladaAsync(result.Cita);
        }

        return Ok(Response<object>.Ok("Cita cancelada exitosamente."));
    }

    // POST: api/Citas/Complete/5
    [HttpPost("Complete/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Response<object>>> Complete(int id)
    {
        var result = await _citaService.CompletarCitaAsync(id);
        if (!result.Success || result.Cita == null)
        {
            return NotFound(Response<object>.Fail("Cita no encontrada."));
        }

        await _notificacionService.NotificarCitaCompletadaAsync(result.Cita);

        return Ok(Response<object>.Ok(new {
            Message = "Cita marcada como completada. Ahora puede registrar el historial clínico.",
            CitaId = id
        }));
    }

    // POST: api/Citas/CambiarEstado/5
    [HttpPost("CambiarEstado/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Response<object>>> CambiarEstado(int id, [FromQuery] string nuevoEstado)
    {
        var citaOld = await _citaService.GetCitaByIdAsync(id);
        if (citaOld == null) return NotFound(Response<object>.Fail("Cita no encontrada."));
        var estadoAnterior = citaOld.Estado;

        var result = await _citaService.CambiarEstadoAsync(id, nuevoEstado);
        if (!result.Success)
        {
            if (result.Error == "No encontrado") return NotFound(Response<object>.Fail("Cita no encontrada."));
            return BadRequest(Response<object>.Fail(result.Error ?? "Error desconocido."));
        }

        if (result.Cita != null && estadoAnterior != nuevoEstado)
        {
            await EnviarNotificacionCambioEstadoAsync(result.Cita);
        }

        var mensaje = nuevoEstado switch
        {
            "Confirmada" => "Cita confirmada. El cliente ha sido notificado.",
            "EnProceso" => "La cita está ahora en proceso. El cliente puede monitorear el estado.",
            "Completada" => "Cita completada. El cliente ha sido notificado para recoger a su mascota.",
            "Cancelada" => "Cita cancelada. El cliente ha sido notificado.",
            _ => "Estado de la cita actualizado."
        };

        return Ok(Response<object>.Ok(mensaje));
    }

    // GET: api/Citas/GetServicioInfo
    [HttpGet("GetServicioInfo")]
    public async Task<ActionResult<Response<object>>> GetServicioInfo([FromQuery] int servicioId)
    {
        var servicio = await _unitOfWork.Servicios.GetByIdAsync(servicioId);
        if (servicio == null)
        {
            return NotFound(Response<object>.Fail("Servicio no encontrado."));
        }

        return Ok(Response<object>.Ok(new
        {
            duracionMinutos = servicio.DuracionMinutos,
            precio = servicio.Precio,
            nombre = servicio.Nombre
        }));
    }

    // GET: api/Citas/GetVeterinarioHorarios
    [HttpGet("GetVeterinarioHorarios")]
    public async Task<ActionResult<Response<object>>> GetVeterinarioHorarios([FromQuery] int veterinarioId)
    {
        var veterinario = await _unitOfWork.Veterinarios.GetByIdAsync(veterinarioId);
        if (veterinario == null)
        {
            return NotFound(Response<object>.Fail("Veterinario no encontrado."));
        }

        return Ok(Response<object>.Ok(new
        {
            horarioInicio = veterinario.HorarioInicio.ToString(@"hh\:mm"),
            horarioFin = veterinario.HorarioFin.ToString(@"hh\:mm")
        }));
    }

    // GET: api/Citas/HorariosDisponibles
    [HttpGet("HorariosDisponibles")]
    public async Task<ActionResult<Response<object>>> HorariosDisponibles([FromQuery] int veterinarioId, [FromQuery] DateTime fecha)
    {
        // Validar si el día seleccionado es laborable según la configuración del negocio
        var configPath = System.IO.Path.Combine(AppContext.BaseDirectory, "ConfiguracionClinica.json");
        if (System.IO.File.Exists(configPath))
        {
            try
            {
                var json = System.IO.File.ReadAllText(configPath);
                var config = System.Text.Json.JsonSerializer.Deserialize<ClinicaConfigDto>(json);
                if (config != null)
                {
                    int dayOfWeek = (int)fecha.DayOfWeek;
                    if (!config.DiasHabiles.Contains(dayOfWeek))
                    {
                        return Ok(Response<object>.Ok(new List<object>(), "La clínica está cerrada el día seleccionado."));
                    }
                }
            }
            catch { }
        }

        var horarios = await _citaService.ObtenerHorariosDisponiblesAsync(veterinarioId, fecha);

        // Opcional: Filtrar horarios para que solo quepan dentro del rango de apertura/cierre general de la clínica
        if (System.IO.File.Exists(configPath))
        {
            try
            {
                var json = System.IO.File.ReadAllText(configPath);
                var config = System.Text.Json.JsonSerializer.Deserialize<ClinicaConfigDto>(json);
                if (config != null)
                {
                    if (TimeSpan.TryParse(config.HoraApertura, out var horaApertura) && TimeSpan.TryParse(config.HoraCierre, out var horaCierre))
                    {
                        horarios = horarios.Where(h => h.TimeOfDay >= horaApertura && h.TimeOfDay < horaCierre).ToList();
                    }
                }
            }
            catch { }
        }

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
        var servicio = await _unitOfWork.Servicios.GetByIdAsync(servicioId);
        if (servicio == null)
        {
            return Ok(Response<object>.Ok(new { disponible = false, mensaje = "Servicio no encontrado." }));
        }

        var (fechaValida, mensajeFecha) = await _citaService.ValidarFechaCitaAsync(veterinarioId, fechaHora);
        if (!fechaValida)
        {
            return Ok(Response<object>.Ok(new { disponible = false, mensaje = mensajeFecha }));
        }

        var disponible = await _citaService.VeterinarioDisponibleAsync(
            veterinarioId, fechaHora, servicio.DuracionMinutos, citaId);

        if (!disponible)
        {
            var horariosDisponibles = await _citaService.ObtenerHorariosDisponiblesAsync(veterinarioId, fechaHora.Date);
            var sugerencias = horariosDisponibles.Take(5).Select(h => h.ToString("HH:mm")).ToList();

            return Ok(Response<object>.Ok(new
            {
                disponible = false,
                mensaje = "Horario no disponible.",
                sugerencias = sugerencias
            }));
        }

        return Ok(Response<object>.Ok(new { disponible = true, mensaje = "Horario disponible." }));
    }

    private async Task EnviarNotificacionCambioEstadoAsync(Cita cita)
    {
        switch (cita.Estado)
        {
            case "Confirmada":
                await _notificacionService.NotificarCitaConfirmadaAsync(cita);
                break;
            case "EnProceso":
                await _notificacionService.NotificarCitaEnProcesoAsync(cita);
                break;
            case "Completada":
                await _notificacionService.NotificarCitaCompletadaAsync(cita);
                break;
            case "Cancelada":
                await _notificacionService.NotificarCitaCanceladaAsync(cita);
                break;
        }
    }
}
