using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Veterinaria.Domain.Contracts;
using Veterinaria.Domain.Entities;
using Veterinaria.Web.Models.Dto;
using Veterinaria.Web.Services;
using X.PagedList.Extensions;

namespace Veterinaria.Web.Controllers;

[Authorize(Roles = "Usuario,Admin")]
public class CitasController : Controller
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly ICitaValidationService _citaValidationService;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly INotificacionService _notificacionService;

    public CitasController(
        IUnitOfWork unitOfWork, 
        IMapper mapper, 
        ICitaValidationService citaValidationService,
        UserManager<ApplicationUser> userManager,
        INotificacionService notificacionService)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _citaValidationService = citaValidationService;
        _userManager = userManager;
        _notificacionService = notificacionService;
    }

    // Método helper para obtener el Usuario actual
    private async Task<Usuario?> GetCurrentUsuarioAsync()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return null;
        
        return await _unitOfWork.Usuarios.GetAll()
            .FirstOrDefaultAsync(u => u.ApplicationUserId == userId);
    }

    // Verificar si el usuario es Admin
    private bool IsAdmin() => User.IsInRole("Admin");

    // GET: Citas/Calendario
    public IActionResult Calendario()
    {
        return View();
    }

    // GET: Citas/CalendarioData
    [HttpGet]
    public async Task<IActionResult> CalendarioData(DateTime? start, DateTime? end)
    {
        var fechaInicio = start ?? DateTime.Today.AddMonths(-1);
        var fechaFin = end ?? DateTime.Today.AddMonths(2);

        var citas = await _unitOfWork.Citas.GetAll()
            .Include(c => c.Mascota)
            .Include(c => c.Servicio)
            .Include(c => c.Veterinario)
            .Where(c => c.FechaHora >= fechaInicio && c.FechaHora <= fechaFin)
            .ToListAsync();

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
            url = Url.Action("Details", "Citas", new { id = c.Id }),
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

        return Json(eventos);
    }

    // GET: Citas
    public async Task<IActionResult> Index(string? estado, int? veterinarioId, DateTime? fechaDesde, DateTime? fechaHasta, int page = 1)
    {
        var query = _unitOfWork.Citas.GetAll()
            .Include(c => c.Mascota)
                .ThenInclude(m => m.Usuario)
            .Include(c => c.Veterinario)
            .Include(c => c.Servicio)
            .AsQueryable();

        // Si NO es admin, filtrar solo las citas del usuario actual
        if (!IsAdmin())
        {
            var currentUsuario = await GetCurrentUsuarioAsync();
            if (currentUsuario != null)
            {
                query = query.Where(c => c.Mascota.UsuarioId == currentUsuario.Id);
            }
            else
            {
                // Usuario no tiene perfil, mostrar lista vacía
                query = query.Where(c => false);
            }
        }

        // Filtros
        if (!string.IsNullOrWhiteSpace(estado))
        {
            query = query.Where(c => c.Estado == estado);
        }

        if (veterinarioId.HasValue)
        {
            query = query.Where(c => c.VeterinarioId == veterinarioId.Value);
        }

        if (fechaDesde.HasValue)
        {
            query = query.Where(c => c.FechaHora >= fechaDesde.Value);
        }

        if (fechaHasta.HasValue)
        {
            var fechaHastaFin = fechaHasta.Value.AddDays(1).AddSeconds(-1);
            query = query.Where(c => c.FechaHora <= fechaHastaFin);
        }

        var citas = query.OrderByDescending(c => c.FechaHora)
            .Select(c => _mapper.Map<CitaDto>(c))
            .ToPagedList(page, 15);

        // ViewBag para filtros
        ViewBag.Estados = new SelectList(new[] { "Pendiente", "Confirmada", "EnProceso", "Completada", "Cancelada" });
        ViewBag.Veterinarios = new SelectList(
            _unitOfWork.Veterinarios.GetAll().Where(v => v.Activo).OrderBy(v => v.Nombre).ToList(),
            "Id", "Nombre");

        ViewBag.CurrentEstado = estado;
        ViewBag.CurrentVeterinarioId = veterinarioId;
        ViewBag.CurrentFechaDesde = fechaDesde?.ToString("yyyy-MM-dd");
        ViewBag.CurrentFechaHasta = fechaHasta?.ToString("yyyy-MM-dd");
        ViewBag.EsAdmin = IsAdmin();

        return View(citas);
    }

    // GET: Citas/Details/5
    public async Task<IActionResult> Details(int id)
    {
        var cita = await _unitOfWork.Citas.GetAll()
            .Include(c => c.Mascota)
                .ThenInclude(m => m.Usuario)
            .Include(c => c.Veterinario)
            .Include(c => c.Servicio)
            .Include(c => c.Historial)
            .Include(c => c.Pagos)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (cita == null)
        {
            return NotFound();
        }

        // Si no es admin, verificar que la cita pertenezca al usuario
        if (!IsAdmin())
        {
            var currentUsuario = await GetCurrentUsuarioAsync();
            if (currentUsuario == null || cita.Mascota.UsuarioId != currentUsuario.Id)
            {
                return Forbid();
            }
        }

        var citaDto = _mapper.Map<CitaDto>(cita);
        ViewBag.TieneHistorial = cita.Historial != null;
        ViewBag.TienePago = cita.Pagos?.Any() ?? false;
        ViewBag.EsAdmin = IsAdmin();
        ViewBag.PropietarioNombre = cita.Mascota?.Usuario?.Nombre;

        // Verificar si el usuario actual es el propietario de la cita
        var currentUser = await GetCurrentUsuarioAsync();
        ViewBag.EsPropietario = currentUser != null && cita.Mascota?.UsuarioId == currentUser.Id;

        // Información de pagos
        ViewBag.EstadoPago = cita.EstadoPago ?? "Pendiente";
        ViewBag.MontoTotal = cita.MontoTotal > 0 ? cita.MontoTotal : cita.Servicio?.Precio ?? 0;
        ViewBag.MontoPagado = cita.MontoPagado;
        ViewBag.TipoPago = cita.TipoPago;
        ViewBag.Pagos = cita.Pagos?.OrderByDescending(p => p.FechaPago).ToList() ?? new List<Pago>();

        return View(citaDto);
    }

    // GET: Citas/GetEstado/5 - Para actualización en tiempo real
    [HttpGet]
    public async Task<IActionResult> GetEstado(int id)
    {
        var cita = await _unitOfWork.Citas.GetAll()
            .Include(c => c.Mascota)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (cita == null)
        {
            return NotFound();
        }

        // Si no es admin, verificar que la cita pertenezca al usuario
        if (!IsAdmin())
        {
            var currentUsuario = await GetCurrentUsuarioAsync();
            if (currentUsuario == null || cita.Mascota.UsuarioId != currentUsuario.Id)
            {
                return Forbid();
            }
        }

        return Json(new { 
            estado = cita.Estado,
            fechaActualizacion = DateTime.Now.ToString("dd/MM/yyyy HH:mm:ss")
        });
    }

    // GET: Citas/Create
    public async Task<IActionResult> Create(int? mascotaId)
    {
        var currentUsuario = await GetCurrentUsuarioAsync();
        
        // Si no es admin y no tiene usuario vinculado, crear uno automáticamente
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
        
        await CargarSelectsViewBag(currentUsuario?.Id);

        var citaDto = new CitaDto
        {
            FechaHora = DateTime.Now.AddDays(1).Date.AddHours(9), // Mañana a las 9 AM por defecto
            Estado = "Pendiente"
        };

        if (mascotaId.HasValue)
        {
            citaDto.MascotaId = mascotaId.Value;
        }

        // Verificar si el usuario tiene mascotas registradas
        var tieneMascotas = currentUsuario != null && 
            await _unitOfWork.Mascotas.GetAll()
                .AnyAsync(m => m.UsuarioId == currentUsuario.Id && m.Activo);
        
        ViewBag.TieneMascotas = tieneMascotas;
        ViewBag.UsuarioId = currentUsuario?.Id;
        ViewBag.EsAdmin = IsAdmin();

        return View(citaDto);
    }

    // POST: Citas/CrearMascotaYCita - Para crear mascota y cita en un solo paso
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> CrearMascotaYCita(CitaDto citaDto, string mascotaNombre, string mascotaEspecie, string? mascotaRaza, decimal? mascotaPeso)
    {
        var currentUsuario = await GetCurrentUsuarioAsync();
        
        if (currentUsuario == null)
        {
            TempData["Error"] = "Debe iniciar sesión para agendar una cita.";
            return RedirectToAction("Login", "Account", new { area = "Identity" });
        }

        // Validar campos de mascota
        if (string.IsNullOrWhiteSpace(mascotaNombre) || string.IsNullOrWhiteSpace(mascotaEspecie))
        {
            TempData["Error"] = "Debe completar el nombre y especie de la mascota.";
            return RedirectToAction(nameof(Create));
        }

        // Crear la mascota
        var mascota = new Mascota
        {
            Nombre = mascotaNombre,
            Especie = mascotaEspecie,
            Raza = mascotaRaza,
            Peso = mascotaPeso,
            UsuarioId = currentUsuario.Id,
            Activo = true
        };

        await _unitOfWork.Mascotas.AddAsync(mascota);
        await _unitOfWork.CommitAsync();

        // Asignar la mascota a la cita
        citaDto.MascotaId = mascota.Id;

        // Validar la cita directamente aquí
        var servicio = await _unitOfWork.Servicios.GetByIdAsync(citaDto.ServicioId);
        if (servicio == null)
        {
            TempData["Error"] = "Servicio no encontrado.";
            return RedirectToAction(nameof(Create));
        }

        // Validar fecha
        var (fechaValida, mensajeFecha) = await _citaValidationService.ValidarFechaCitaAsync(
            citaDto.VeterinarioId, citaDto.FechaHora);
        
        if (!fechaValida)
        {
            TempData["Error"] = mensajeFecha;
            return RedirectToAction(nameof(Create));
        }

        // Validar disponibilidad
        var veterinarioDisponible = await _citaValidationService.VeterinarioDisponibleAsync(
            citaDto.VeterinarioId, citaDto.FechaHora, servicio.DuracionMinutos, null);

        if (!veterinarioDisponible)
        {
            TempData["Error"] = "El veterinario no está disponible en ese horario.";
            return RedirectToAction(nameof(Create));
        }

        // Crear la cita
        var cita = _mapper.Map<Cita>(citaDto);
        cita.Estado = "Pendiente";
        cita.EstadoPago = "Pendiente";
        cita.MontoTotal = servicio.Precio;
        cita.MontoPagado = 0;
        cita.FechaCreacion = DateTime.UtcNow;

        await _unitOfWork.Citas.AddAsync(cita);
        await _unitOfWork.CommitAsync();

        TempData["Info"] = $"Mascota '{mascota.Nombre}' registrada. Ahora proceda a realizar el pago para confirmar la cita.";
        return RedirectToAction("Pagar", "PagoCita", new { citaId = cita.Id });
    }

    // POST: Citas/Create
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(CitaDto citaDto)
    {
        var currentUsuario = await GetCurrentUsuarioAsync();
        
        if (ModelState.IsValid)
        {
            // Obtener servicio para la duración
            var servicio = await _unitOfWork.Servicios.GetByIdAsync(citaDto.ServicioId);
            if (servicio == null)
            {
                ModelState.AddModelError("ServicioId", "Servicio no encontrado.");
                await CargarSelectsViewBag(currentUsuario?.Id);
                return View(citaDto);
            }

            // VALIDACIÓN 1: Validar fecha de la cita (pasado, horario del veterinario, etc.)
            var (fechaValida, mensajeFecha) = await _citaValidationService.ValidarFechaCitaAsync(
                citaDto.VeterinarioId, citaDto.FechaHora);
            
            if (!fechaValida)
            {
                ModelState.AddModelError("FechaHora", mensajeFecha!);
                await CargarSelectsViewBag(currentUsuario?.Id);
                return View(citaDto);
            }

            // VALIDACIÓN 2: Verificar disponibilidad del veterinario
            var veterinarioDisponible = await _citaValidationService.VeterinarioDisponibleAsync(
                citaDto.VeterinarioId, 
                citaDto.FechaHora, 
                servicio.DuracionMinutos,
                citaDto.Id > 0 ? citaDto.Id : null);

            if (!veterinarioDisponible)
            {
                // Obtener horarios disponibles para sugerir alternativas
                var horariosDisponibles = await _citaValidationService.ObtenerHorariosDisponiblesAsync(
                    citaDto.VeterinarioId, citaDto.FechaHora.Date);

                var sugerencia = horariosDisponibles.Any() 
                    ? $" Horarios disponibles: {string.Join(", ", horariosDisponibles.Take(5).Select(h => h.ToString("HH:mm")))}"
                    : " No hay horarios disponibles para esta fecha.";

                ModelState.AddModelError("FechaHora", 
                    $"El veterinario no está disponible en ese horario.{sugerencia}");
                await CargarSelectsViewBag(currentUsuario?.Id);
                return View(citaDto);
            }

            // VALIDACIÓN 3: Verificar pagos pendientes de la mascota
            var tienePagosPendientes = await _citaValidationService.MascotaTienePagosPendientesAsync(citaDto.MascotaId);
            if (tienePagosPendientes)
            {
                ModelState.AddModelError("MascotaId", 
                    "La mascota tiene pagos pendientes. Por favor, liquide las deudas antes de agendar una nueva cita.");
                await CargarSelectsViewBag(currentUsuario?.Id);
                return View(citaDto);
            }

            // Crear la cita
            var cita = _mapper.Map<Cita>(citaDto);
            cita.Estado = "Pendiente";
            cita.EstadoPago = "Pendiente";
            cita.MontoTotal = servicio.Precio;
            cita.MontoPagado = 0;
            cita.FechaCreacion = DateTime.UtcNow;

            await _unitOfWork.Citas.AddAsync(cita);
            await _unitOfWork.CommitAsync();

            // Redirigir al proceso de pago
            TempData["Info"] = "¡Cita creada! Ahora proceda a realizar el pago para confirmarla.";
            return RedirectToAction("Pagar", "PagoCita", new { citaId = cita.Id });
        }

        await CargarSelectsViewBag(currentUsuario?.Id);
        ViewBag.TieneMascotas = currentUsuario != null && 
            await _unitOfWork.Mascotas.GetAll().AnyAsync(m => m.UsuarioId == currentUsuario.Id && m.Activo);
        ViewBag.UsuarioId = currentUsuario?.Id;
        ViewBag.EsAdmin = IsAdmin();
        return View(citaDto);
    }

    // GET: Citas/Edit/5
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Edit(int id)
    {
        var cita = await _unitOfWork.Citas.GetByIdAsync(id);
        if (cita == null)
        {
            return NotFound();
        }

        var citaDto = _mapper.Map<CitaDto>(cita);
        ViewBag.Estados = new SelectList(new[] { "Pendiente", "Confirmada", "EnProceso", "Completada", "Cancelada" });

        return View(citaDto);
    }

    // POST: Citas/Edit/5
    [HttpPost]
    [ValidateAntiForgeryToken]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Edit(int id, CitaDto citaDto)
    {
        if (id != citaDto.Id)
        {
            return NotFound();
        }

        if (ModelState.IsValid)
        {
            var cita = await _unitOfWork.Citas.GetAll()
                .Include(c => c.Mascota)
                .Include(c => c.Servicio)
                .FirstOrDefaultAsync(c => c.Id == id);
            if (cita == null)
            {
                return NotFound();
            }

            var estadoAnterior = cita.Estado;
            
            // Solo actualizar estado y motivo (admin puede cambiar el estado)
            cita.Estado = citaDto.Estado;
            cita.Motivo = citaDto.Motivo;

            _unitOfWork.Citas.Update(cita);
            await _unitOfWork.CommitAsync();

            // Enviar notificación si cambió el estado
            if (estadoAnterior != citaDto.Estado)
            {
                await EnviarNotificacionCambioEstadoAsync(cita);
            }

            TempData["Success"] = "Cita actualizada exitosamente.";
            return RedirectToAction(nameof(Details), new { id });
        }

        ViewBag.Estados = new SelectList(new[] { "Pendiente", "Confirmada", "EnProceso", "Completada", "Cancelada" });
        return View(citaDto);
    }

    // POST: Citas/Cancel/5
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Cancel(int id)
    {
        var cita = await _unitOfWork.Citas.GetAll()
            .Include(c => c.Mascota)
            .FirstOrDefaultAsync(c => c.Id == id);
            
        if (cita == null)
        {
            return NotFound();
        }

        // Si no es admin, verificar que la cita pertenezca al usuario
        if (!IsAdmin())
        {
            var currentUsuario = await GetCurrentUsuarioAsync();
            if (currentUsuario == null || cita.Mascota.UsuarioId != currentUsuario.Id)
            {
                return Forbid();
            }
        }

        // Solo se puede cancelar si está en estado "Pendiente" o "Confirmada" (usuario puede cancelar antes de la cita)
        if (cita.Estado != "Pendiente" && cita.Estado != "Confirmada")
        {
            TempData["Error"] = "Solo se pueden cancelar citas en estado 'Pendiente' o 'Confirmada'.";
            return RedirectToAction(nameof(Details), new { id });
        }

        cita.Estado = "Cancelada";
        _unitOfWork.Citas.Update(cita);
        await _unitOfWork.CommitAsync();

        // Enviar notificación de cancelación
        await _notificacionService.NotificarCitaCanceladaAsync(cita);

        TempData["Success"] = "Cita cancelada exitosamente.";
        return RedirectToAction(nameof(Index));
    }

    // POST: Citas/Complete/5
    [HttpPost]
    [ValidateAntiForgeryToken]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Complete(int id)
    {
        var cita = await _unitOfWork.Citas.GetAll()
            .Include(c => c.Mascota)
            .Include(c => c.Servicio)
            .FirstOrDefaultAsync(c => c.Id == id);
        if (cita == null)
        {
            return NotFound();
        }

        cita.Estado = "Completada";
        _unitOfWork.Citas.Update(cita);
        await _unitOfWork.CommitAsync();

        // Enviar notificación de cita completada
        await _notificacionService.NotificarCitaCompletadaAsync(cita);

        TempData["Success"] = "Cita marcada como completada. Ahora puede registrar el historial clínico.";
        return RedirectToAction("Create", "HistorialesClinicos", new { citaId = id });
    }

    // POST: Citas/CambiarEstado/5
    [HttpPost]
    [ValidateAntiForgeryToken]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CambiarEstado(int id, string nuevoEstado)
    {
        var cita = await _unitOfWork.Citas.GetAll()
            .Include(c => c.Mascota)
            .Include(c => c.Servicio)
            .FirstOrDefaultAsync(c => c.Id == id);
            
        if (cita == null)
        {
            return NotFound();
        }

        var estadosValidos = new[] { "Pendiente", "Confirmada", "EnProceso", "Completada", "Cancelada" };
        if (!estadosValidos.Contains(nuevoEstado))
        {
            TempData["Error"] = "Estado no válido.";
            return RedirectToAction(nameof(Details), new { id });
        }

        var estadoAnterior = cita.Estado;
        cita.Estado = nuevoEstado;
        _unitOfWork.Citas.Update(cita);
        await _unitOfWork.CommitAsync();

        // Enviar notificación si cambió el estado
        if (estadoAnterior != nuevoEstado)
        {
            await EnviarNotificacionCambioEstadoAsync(cita);
        }

        var mensaje = nuevoEstado switch
        {
            "Confirmada" => "Cita confirmada. El cliente ha sido notificado.",
            "EnProceso" => "La cita está ahora en proceso. El cliente puede monitorear el estado.",
            "Completada" => "Cita completada. El cliente ha sido notificado para recoger a su mascota.",
            "Cancelada" => "Cita cancelada. El cliente ha sido notificado.",
            _ => "Estado de la cita actualizado."
        };

        TempData["Success"] = mensaje;
        return RedirectToAction(nameof(Details), new { id });
    }

    // API: Obtener información del servicio (para JavaScript)
    [HttpGet]
    public async Task<IActionResult> GetServicioInfo(int servicioId)
    {
        var servicio = await _unitOfWork.Servicios.GetByIdAsync(servicioId);
        if (servicio == null)
        {
            return NotFound();
        }

        return Json(new
        {
            duracionMinutos = servicio.DuracionMinutos,
            precio = servicio.Precio,
            nombre = servicio.Nombre
        });
    }

    // API: Obtener horarios disponibles del veterinario
    [HttpGet]
    public async Task<IActionResult> GetVeterinarioHorarios(int veterinarioId)
    {
        var veterinario = await _unitOfWork.Veterinarios.GetByIdAsync(veterinarioId);
        if (veterinario == null)
        {
            return NotFound();
        }

        return Json(new
        {
            horarioInicio = veterinario.HorarioInicio.ToString(@"hh\:mm"),
            horarioFin = veterinario.HorarioFin.ToString(@"hh\:mm")
        });
    }

    private async Task CargarSelectsViewBag(int? usuarioId = null)
    {
        IEnumerable<Mascota> mascotas;
        
        // Si es admin o no se especifica usuarioId, mostrar todas las mascotas
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
            // Si es usuario normal, mostrar solo SUS mascotas
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

        ViewBag.Mascotas = new SelectList(mascotas, "Id", "Nombre");
        ViewBag.Veterinarios = new SelectList(veterinarios, "Id", "Nombre");
        
        // Servicios con precio incluido en el texto
        var serviciosConPrecio = servicios.Select(s => new {
            Id = s.Id,
            NombreConPrecio = $"{s.Nombre} - S/. {s.Precio:N2}"
        });
        ViewBag.Servicios = new SelectList(serviciosConPrecio, "Id", "NombreConPrecio");
    }

    // GET: Citas/HorariosDisponibles
    [HttpGet]
    public async Task<IActionResult> HorariosDisponibles(int veterinarioId, DateTime fecha)
    {
        var horarios = await _citaValidationService.ObtenerHorariosDisponiblesAsync(veterinarioId, fecha);
        
        var result = horarios.Select(h => new 
        { 
            value = h.ToString("yyyy-MM-ddTHH:mm"),
            text = h.ToString("HH:mm")
        });

        return Json(result);
    }

    // GET: Citas/ValidarDisponibilidad
    [HttpGet]
    public async Task<IActionResult> ValidarDisponibilidad(int veterinarioId, DateTime fechaHora, int servicioId, int? citaId = null)
    {
        var servicio = await _unitOfWork.Servicios.GetByIdAsync(servicioId);
        if (servicio == null)
        {
            return Json(new { disponible = false, mensaje = "Servicio no encontrado." });
        }

        // Validar fecha
        var (fechaValida, mensajeFecha) = await _citaValidationService.ValidarFechaCitaAsync(veterinarioId, fechaHora);
        if (!fechaValida)
        {
            return Json(new { disponible = false, mensaje = mensajeFecha });
        }

        // Validar disponibilidad
        var disponible = await _citaValidationService.VeterinarioDisponibleAsync(
            veterinarioId, fechaHora, servicio.DuracionMinutos, citaId);

        if (!disponible)
        {
            var horariosDisponibles = await _citaValidationService.ObtenerHorariosDisponiblesAsync(veterinarioId, fechaHora.Date);
            var sugerencias = horariosDisponibles.Take(5).Select(h => h.ToString("HH:mm")).ToList();
            
            return Json(new 
            { 
                disponible = false, 
                mensaje = "Horario no disponible.",
                sugerencias = sugerencias
            });
        }

        return Json(new { disponible = true, mensaje = "Horario disponible." });
    }

    // Método helper para enviar notificaciones según el cambio de estado
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
