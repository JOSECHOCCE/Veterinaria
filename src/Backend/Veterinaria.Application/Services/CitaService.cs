using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Veterinaria.Application.Interfaces;
using Veterinaria.Domain.Contracts;
using Veterinaria.Domain.Entities;

namespace Veterinaria.Application.Services;

public class CitaService : ICitaService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditoriaService _auditoriaService;

    public CitaService(IUnitOfWork unitOfWork, IAuditoriaService auditoriaService)
    {
        _unitOfWork = unitOfWork;
        _auditoriaService = auditoriaService;
    }

    public async Task<List<Cita>> GetCitasParaCalendarioAsync(DateTime? fechaInicio, DateTime? fechaFin)
    {
        var start = fechaInicio ?? DateTime.Today.AddMonths(-1);
        var end = fechaFin ?? DateTime.Today.AddMonths(2);

        return await _unitOfWork.Citas.GetAll()
            .Include(c => c.Mascota)
                .ThenInclude(m => m.Usuario)
            .Include(c => c.Servicio)
            .Include(c => c.Veterinario)
            .Where(c => c.FechaHora >= start && c.FechaHora <= end)
            .ToListAsync();
    }

    public IQueryable<Cita> GetCitasQuery(bool isAdmin, int? currentUsuarioId, string? estado, int? veterinarioId, DateTime? fechaDesde, DateTime? fechaHasta)
    {
        var query = _unitOfWork.Citas.GetAll()
            .Include(c => c.Mascota)
                .ThenInclude(m => m.Usuario)
            .Include(c => c.Veterinario)
            .Include(c => c.Servicio)
            .AsQueryable();

        if (!isAdmin)
        {
            if (currentUsuarioId != null)
            {
                query = query.Where(c => c.Mascota.UsuarioId == currentUsuarioId);
            }
            else
            {
                query = query.Where(c => false);
            }
        }

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

        return query;
    }

    public async Task<Cita?> GetCitaDetailsAsync(int id, bool isAdmin, int? currentUsuarioId)
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
            return null;

        if (!isAdmin && (currentUsuarioId == null || cita.Mascota.UsuarioId != currentUsuarioId))
        {
            return null; // Equivalent to Forbid, handled by controller
        }

        return cita;
    }

    public async Task<Cita?> GetCitaByIdAsync(int id)
    {
        return await _unitOfWork.Citas.GetAll()
            .Include(c => c.Mascota)
            .Include(c => c.Servicio)
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<bool> VeterinarioDisponibleAsync(int veterinarioId, DateTime fechaHora, int duracionMinutos, int? citaIdExcluir = null)
    {
        var veterinario = await _unitOfWork.Veterinarios.GetByIdAsync(veterinarioId);
        if (veterinario == null || !veterinario.Activo)
            return false;

        var diaSemana = (int)fechaHora.DayOfWeek;
        var horaCita = fechaHora.TimeOfDay;
        var horaFinCita = horaCita.Add(TimeSpan.FromMinutes(duracionMinutos));

        // Validar Horario Clínica
        var horarioClinica = await _unitOfWork.HorariosClinica.GetAll().FirstOrDefaultAsync(h => h.DiaSemana == diaSemana);
        if (horarioClinica != null)
        {
            if (!horarioClinica.EsLaborable) return false;
            if (horaCita < horarioClinica.HoraApertura || horaFinCita > horarioClinica.HoraCierre) return false;
        }

        // Validar Horario Veterinario
        var horarioVet = await _unitOfWork.HorariosVeterinario.GetAll().FirstOrDefaultAsync(h => h.VeterinarioId == veterinarioId && h.DiaSemana == diaSemana);
        if (horarioVet != null)
        {
            if (!horarioVet.EsLaborable) return false;
            if (horaCita < horarioVet.HoraInicio || horaFinCita > horarioVet.HoraFin) return false;
            if (horarioVet.DescansoInicio.HasValue && horarioVet.DescansoFin.HasValue)
            {
                bool solapaDescanso = !(horaFinCita <= horarioVet.DescansoInicio.Value || horaCita >= horarioVet.DescansoFin.Value);
                if (solapaDescanso) return false;
            }
        }
        else
        {
            // Fallback al horario general si no hay específico
            if (horaCita < veterinario.HorarioInicio || horaFinCita > veterinario.HorarioFin)
                return false;
        }

        // Validar Bloqueos
        var finNuevaDate = fechaHora.AddMinutes(duracionMinutos);
        var bloqueos = await _unitOfWork.BloqueosAgenda.GetAll()
            .Where(b => b.VeterinarioId == veterinarioId && b.FechaInicio < finNuevaDate && b.FechaFin > fechaHora)
            .AnyAsync();
        
        if (bloqueos) return false;

        // Validar Citas
        var fechaInicio = fechaHora.Date;
        var fechaFin = fechaInicio.AddDays(1);

        var citasDelDia = await _unitOfWork.Citas.GetAll()
            .Include(c => c.Servicio)
            .Where(c => c.VeterinarioId == veterinarioId
                     && c.FechaHora >= fechaInicio
                     && c.FechaHora < fechaFin
                     && c.Estado != "Cancelada" && c.Estado != "Rechazada" && c.Estado != "NoAsistio"
                     && (citaIdExcluir == null || c.Id != citaIdExcluir))
            .ToListAsync();

        var ahora = DateTime.UtcNow;

        foreach (var citaExistente in citasDelDia)
        {
            // Ignorar reservas expiradas
            if (citaExistente.Estado == "ReservaTemporal" && citaExistente.FechaExpiracionReserva.HasValue && citaExistente.FechaExpiracionReserva.Value < ahora)
                continue;

            var duracionExistente = citaExistente.Servicio?.DuracionMinutos ?? 30;
            var inicioCitaExistente = citaExistente.FechaHora;
            var finCitaExistente = citaExistente.FechaHora.AddMinutes(duracionExistente);

            bool hayConflicto = !(finNuevaDate <= inicioCitaExistente || fechaHora >= finCitaExistente);
            if (hayConflicto)
                return false;
        }

        return true;
    }

    public async Task<bool> MascotaTienePagosPendientesAsync(int mascotaId)
    {
        var citaIds = await _unitOfWork.Citas.GetAll()
            .Where(c => c.MascotaId == mascotaId)
            .Select(c => c.Id)
            .ToListAsync();

        if (!citaIds.Any())
            return false;

        return await _unitOfWork.Citas.GetAll()
            .Where(c => citaIds.Contains(c.Id) && c.EstadoPago == "Parcial" && c.Estado == "Completada")
            .AnyAsync();
    }

    public async Task<List<DateTime>> ObtenerHorariosDisponiblesAsync(int veterinarioId, DateTime fecha)
    {
        var horariosDisponibles = new List<DateTime>();
        var veterinario = await _unitOfWork.Veterinarios.GetByIdAsync(veterinarioId);
        if (veterinario == null || !veterinario.Activo)
            return horariosDisponibles;

        var diaSemana = (int)fecha.DayOfWeek;
        
        var horarioClinica = await _unitOfWork.HorariosClinica.GetAll().FirstOrDefaultAsync(h => h.DiaSemana == diaSemana);
        if (horarioClinica != null && !horarioClinica.EsLaborable) return horariosDisponibles;

        var horarioVet = await _unitOfWork.HorariosVeterinario.GetAll().FirstOrDefaultAsync(h => h.VeterinarioId == veterinarioId && h.DiaSemana == diaSemana);
        if (horarioVet != null && !horarioVet.EsLaborable) return horariosDisponibles;

        var horaInicio = horarioVet?.HoraInicio ?? veterinario.HorarioInicio;
        var horaFin = horarioVet?.HoraFin ?? veterinario.HorarioFin;

        if (horarioClinica != null)
        {
            if (horaInicio < horarioClinica.HoraApertura) horaInicio = horarioClinica.HoraApertura;
            if (horaFin > horarioClinica.HoraCierre) horaFin = horarioClinica.HoraCierre;
        }

        var slotDuracion = 30;
        var fechaBase = fecha.Date;
        var horaActual = horaInicio;

        while (horaActual.Add(TimeSpan.FromMinutes(slotDuracion)) <= horaFin)
        {
            var slotDateTime = fechaBase.Add(horaActual);
            
            if (fecha.Date == DateTime.Today && slotDateTime <= DateTime.Now)
            {
                horaActual = horaActual.Add(TimeSpan.FromMinutes(slotDuracion));
                continue;
            }

            // Excluir descanso
            bool enDescanso = false;
            if (horarioVet?.DescansoInicio != null && horarioVet?.DescansoFin != null)
            {
                var finSlotHora = horaActual.Add(TimeSpan.FromMinutes(slotDuracion));
                enDescanso = !(finSlotHora <= horarioVet.DescansoInicio.Value || horaActual >= horarioVet.DescansoFin.Value);
            }

            if (!enDescanso)
            {
                horariosDisponibles.Add(slotDateTime);
            }

            horaActual = horaActual.Add(TimeSpan.FromMinutes(slotDuracion));
        }

        // Excluir bloqueos
        var fechaFinDia = fechaBase.AddDays(1);
        var bloqueos = await _unitOfWork.BloqueosAgenda.GetAll()
            .Where(b => b.VeterinarioId == veterinarioId && b.FechaFin > fechaBase && b.FechaInicio < fechaFinDia)
            .ToListAsync();

        foreach (var b in bloqueos)
        {
            horariosDisponibles.RemoveAll(slot =>
            {
                var finSlot = slot.AddMinutes(slotDuracion);
                return !(finSlot <= b.FechaInicio || slot >= b.FechaFin);
            });
        }

        // Excluir citas
        var citasDelDia = await _unitOfWork.Citas.GetAll()
            .Include(c => c.Servicio)
            .Where(c => c.VeterinarioId == veterinarioId
                     && c.FechaHora >= fechaBase
                     && c.FechaHora < fechaFinDia
                     && c.Estado != "Cancelada" && c.Estado != "Rechazada" && c.Estado != "NoAsistio")
            .ToListAsync();

        var ahora = DateTime.UtcNow;

        foreach (var cita in citasDelDia)
        {
            if (cita.Estado == "ReservaTemporal" && cita.FechaExpiracionReserva.HasValue && cita.FechaExpiracionReserva.Value < ahora)
                continue;

            var duracionCita = cita.Servicio?.DuracionMinutos ?? 30;
            var inicioCita = cita.FechaHora;
            var finCita = cita.FechaHora.AddMinutes(duracionCita);

            horariosDisponibles.RemoveAll(slot =>
            {
                var finSlot = slot.AddMinutes(slotDuracion);
                return !(finSlot <= inicioCita || slot >= finCita);
            });
        }

        return horariosDisponibles.OrderBy(h => h).ToList();
    }

    public async Task<(bool EsValida, string? MensajeError)> ValidarFechaCitaAsync(int veterinarioId, DateTime fechaHora)
    {
        if (fechaHora < DateTime.Now)
            return (false, "No se pueden programar citas en fechas pasadas.");

        if (fechaHora > DateTime.Now.AddMonths(3))
            return (false, "No se pueden programar citas con más de 3 meses de anticipación.");

        var veterinario = await _unitOfWork.Veterinarios.GetByIdAsync(veterinarioId);
        if (veterinario == null)
            return (false, "Veterinario no encontrado.");

        if (!veterinario.Activo)
            return (false, "El veterinario seleccionado no está activo.");

        var diaSemana = (int)fechaHora.DayOfWeek;
        
        var horarioClinica = await _unitOfWork.HorariosClinica.GetAll().FirstOrDefaultAsync(h => h.DiaSemana == diaSemana);
        if (horarioClinica != null && !horarioClinica.EsLaborable) 
            return (false, "La clínica no atiende ese día.");

        var horarioVet = await _unitOfWork.HorariosVeterinario.GetAll().FirstOrDefaultAsync(h => h.VeterinarioId == veterinarioId && h.DiaSemana == diaSemana);
        if (horarioVet != null && !horarioVet.EsLaborable) 
            return (false, "El veterinario no atiende ese día.");

        var horaInicio = horarioVet?.HoraInicio ?? veterinario.HorarioInicio;
        var horaFin = horarioVet?.HoraFin ?? veterinario.HorarioFin;
        var horaCita = fechaHora.TimeOfDay;

        if (horaCita < horaInicio)
            return (false, $"La hora de la cita es antes del horario de inicio del veterinario ({horaInicio:hh\\:mm}).");

        if (horaCita >= horaFin)
            return (false, $"La hora de la cita es después del horario de fin del veterinario ({horaFin:hh\\:mm}).");

        if (horarioClinica != null)
        {
            if (horaCita < horarioClinica.HoraApertura || horaCita >= horarioClinica.HoraCierre)
                return (false, "La cita está fuera del horario general de la clínica.");
        }

        return (true, null);
    }

    public async Task<Mascota> CreateMascotaAsync(Mascota mascota)
    {
        await _unitOfWork.Mascotas.AddAsync(mascota);
        await _unitOfWork.CommitAsync();
        return mascota;
    }

    public async Task<Cita> ReservaTemporalCitaAsync(Cita cita, decimal precioServicio)
    {
        // Buscar si existe alguna ReservaTemporal ya expirada para el mismo veterinario y fechaHora
        var reservaExpirada = await _unitOfWork.Citas.GetAll()
            .FirstOrDefaultAsync(c => c.VeterinarioId == cita.VeterinarioId 
                                   && c.FechaHora == cita.FechaHora 
                                   && c.Estado == "ReservaTemporal");

        if (reservaExpirada != null)
        {
            var ahoraUtc = DateTime.UtcNow;
            if (reservaExpirada.FechaExpiracionReserva.HasValue && reservaExpirada.FechaExpiracionReserva.Value < ahoraUtc)
            {
                // Eliminar la reserva expirada físicamente para liberar el índice único
                _unitOfWork.Citas.Remove(reservaExpirada);
                await _unitOfWork.CommitAsync();
            }
        }

        var esValida = await ValidarYConfigurarCitaAsync(cita, "ReservaTemporal", precioServicio);
        cita.FechaExpiracionReserva = DateTime.UtcNow.AddMinutes(5);

        await _unitOfWork.Citas.AddAsync(cita);
        await _unitOfWork.CommitAsync();
        return cita;
    }

    public async Task<Cita> CreateCitaAsync(Cita cita, decimal precioServicio)
    {
        // Determinamos el estado según el rol (el controller puede configurar el estado correcto o dejarlo PendienteConfirmacion por portal)
        if (string.IsNullOrEmpty(cita.Estado))
        {
            cita.Estado = "PendienteConfirmacion";
        }

        await ValidarYConfigurarCitaAsync(cita, cita.Estado, precioServicio);

        await _unitOfWork.Citas.AddAsync(cita);
        await _unitOfWork.CommitAsync();
        return cita;
    }

    private async Task<bool> ValidarYConfigurarCitaAsync(Cita cita, string estadoInicial, decimal precioServicio)
    {
        var servicio = await _unitOfWork.Servicios.GetByIdAsync(cita.ServicioId);
        if (servicio == null || !servicio.Activo)
            throw new InvalidOperationException("El servicio seleccionado no está disponible.");

        var mascota = await _unitOfWork.Mascotas.GetByIdAsync(cita.MascotaId);
        if (mascota == null || !mascota.Activo)
            throw new InvalidOperationException("La mascota seleccionada no está activa.");

        var duracion = servicio.DuracionMinutos;
        
        // Validación Especialidad (Regla 13)
        if (!string.IsNullOrEmpty(servicio.EspecialidadRequerida))
        {
            var veterinario = await _unitOfWork.Veterinarios.GetByIdAsync(cita.VeterinarioId);
            if (veterinario == null || string.IsNullOrEmpty(veterinario.Especialidad) || !veterinario.Especialidad.Contains(servicio.EspecialidadRequerida))
            {
                throw new InvalidOperationException($"El servicio requiere especialidad: {servicio.EspecialidadRequerida}");
            }
        }

        // Validar mascota no tenga cita concurrente (Regla 4)
        var finNueva = cita.FechaHora.AddMinutes(duracion);
        var mascotaConflicto = await _unitOfWork.Citas.GetAll()
            .Include(c => c.Servicio)
            .Where(c => c.MascotaId == cita.MascotaId
                     && c.Estado != "Cancelada" && c.Estado != "Rechazada" && c.Estado != "NoAsistio")
            .ToListAsync();

        var ahora = DateTime.UtcNow;
        foreach (var existente in mascotaConflicto)
        {
            if (existente.Estado == "ReservaTemporal" && existente.FechaExpiracionReserva.HasValue && existente.FechaExpiracionReserva.Value < ahora)
                continue;

            var durExistente = existente.Servicio?.DuracionMinutos ?? 30;
            var finExistente = existente.FechaHora.AddMinutes(durExistente);
            if (!(finNueva <= existente.FechaHora || cita.FechaHora >= finExistente))
                throw new InvalidOperationException("La mascota ya tiene una cita programada en ese horario.");
        }

        // Validar disponibilidad real (Reglas 1, 2, 3)
        // Bypass si es urgencia y el admin forzó, pero el requerimiento base dice que urgecnia puede sobreescribir. Lo mantenemos simple.
        if (!cita.EsUrgencia)
        {
            var veterinarioDisponible = await VeterinarioDisponibleAsync(cita.VeterinarioId, cita.FechaHora, duracion);
            if (!veterinarioDisponible)
                throw new InvalidOperationException("El bloque seleccionado ya no se encuentra disponible.");
        }

        cita.Estado = estadoInicial;
        cita.EstadoPago = "Pendiente";
        cita.MontoTotal = precioServicio;
        cita.MontoPagado = 0;
        cita.FechaCreacion = DateTime.UtcNow;
        
        return true;
    }

    public async Task<(bool Success, Cita? Cita)> EditCitaAsync(int id, string nuevoEstado, string? motivo, DateTime? nuevaFechaHora = null, int? nuevoVeterinarioId = null, string? reprogramadoPorUsuarioId = null)
    {
        var cita = await GetCitaByIdAsync(id);
        if (cita == null)
            return (false, null);

        bool esReprogramacion = false;
        DateTime fechaAnterior = cita.FechaHora;
        int veterinarioAnteriorId = cita.VeterinarioId;

        if (nuevaFechaHora.HasValue && nuevaFechaHora.Value != cita.FechaHora)
        {
            esReprogramacion = true;
            cita.FechaHora = nuevaFechaHora.Value;
        }

        if (nuevoVeterinarioId.HasValue && nuevoVeterinarioId.Value != cita.VeterinarioId)
        {
            esReprogramacion = true;
            cita.VeterinarioId = nuevoVeterinarioId.Value;
        }

        if (esReprogramacion)
        {
            // Regla 14: Validar disponibilidad en reprogramación
            var duracion = cita.Servicio?.DuracionMinutos ?? 30;
            var disponible = await VeterinarioDisponibleAsync(cita.VeterinarioId, cita.FechaHora, duracion, cita.Id);
            if (!disponible)
            {
                throw new InvalidOperationException("El nuevo horario no está disponible.");
            }

            cita.Estado = "Reprogramada"; // Diagrama de estados
            cita.ReprogramadoPorUsuarioId = reprogramadoPorUsuarioId;
            cita.FechaReprogramacion = DateTime.UtcNow;
            cita.MotivoReprogramacion = motivo;

            _unitOfWork.Citas.Update(cita);
            await _unitOfWork.CommitAsync();

            await _auditoriaService.RegistrarAccionAsync(
                "Reprogramar Cita",
                "Cita",
                cita.Id.ToString(),
                $"Reprogramada. Fecha anterior: {fechaAnterior:yyyy-MM-dd HH:mm}, nueva: {cita.FechaHora:yyyy-MM-dd HH:mm}. Vet ant: {veterinarioAnteriorId}, nuevo: {cita.VeterinarioId}."
            );
        }
        else
        {
            cita.Estado = nuevoEstado;
            cita.Motivo = motivo;

            _unitOfWork.Citas.Update(cita);
            await _unitOfWork.CommitAsync();

            await _auditoriaService.RegistrarAccionAsync(
                "Modificar Cita",
                "Cita",
                cita.Id.ToString(),
                $"Modificada. Estado: {nuevoEstado}. Motivo: {motivo}"
            );
        }

        return (true, cita);
    }

    public async Task<(bool Success, Cita? Cita, string? Error)> CancelarCitaAsync(int id, bool isAdmin, int? currentUsuarioId)
    {
        var cita = await GetCitaByIdAsync(id);
        if (cita == null)
            return (false, null, "No encontrado");

        if (!isAdmin && (currentUsuarioId == null || cita.Mascota.UsuarioId != currentUsuarioId))
            return (false, null, "Forbid");

        var permitidosCancelacion = new[] { "ReservaTemporal", "PendienteConfirmacion", "PendienteAsignacion", "Confirmada", "EnEspera", "Reprogramada" };
        if (!permitidosCancelacion.Contains(cita.Estado))
            return (false, null, "No se puede cancelar en el estado actual.");

        // Regla 11: Cancelación con 2 horas (solo clientes)
        if (!isAdmin && cita.FechaHora <= DateTime.Now.AddHours(2))
            return (false, null, "Solo puedes cancelar citas con al menos 2 horas de anticipación.");

        cita.Estado = "Cancelada";
        _unitOfWork.Citas.Update(cita);
        await _unitOfWork.CommitAsync();

        await _auditoriaService.RegistrarAccionAsync(
            "Cancelar Cita",
            "Cita",
            cita.Id.ToString(),
            $"Cancelada por {(isAdmin ? "Administración/Recepcionista" : "Cliente")}. UsuarioID: {currentUsuarioId}"
        );

        return (true, cita, null);
    }

    public async Task<(bool Success, Cita? Cita)> CompletarCitaAsync(int id)
    {
        var cita = await GetCitaByIdAsync(id);
        if (cita == null)
            return (false, null);

        // Regla 36: CompletarCita viene de EnAtencion
        if (cita.Estado != "EnAtencion" && cita.Estado != "EnProceso")
            return (false, null);

        cita.Estado = "Completada";
        _unitOfWork.Citas.Update(cita);
        await _unitOfWork.CommitAsync();
        return (true, cita);
    }

    private static readonly Dictionary<string, string[]> _transicionesValidas = new()
    {
        ["ReservaTemporal"]         = new[] { "PendienteConfirmacion", "Libre" },
        ["PendienteConfirmacion"]   = new[] { "Confirmada", "Rechazada", "Cancelada", "PendienteAsignacion" },
        ["PendienteAsignacion"]     = new[] { "Confirmada", "Cancelada", "Rechazada" },
        ["Confirmada"]              = new[] { "EnEspera", "EnAtencion", "Cancelada", "NoAsistio", "Reprogramada" },
        ["Reprogramada"]            = new[] { "Confirmada", "Cancelada" },
        ["EnEspera"]                = new[] { "EnAtencion", "Cancelada", "NoAsistio" },
        ["EnAtencion"]              = new[] { "Completada", "Cancelada" },
        ["Completada"]              = Array.Empty<string>(),
        ["Cancelada"]               = Array.Empty<string>(),
        ["Rechazada"]               = Array.Empty<string>(),
        ["NoAsistio"]               = Array.Empty<string>(),
        // Para backwards compatibility temporal si quedan datos viejos
        ["Solicitada"]              = new[] { "Confirmada", "Rechazada", "Cancelada", "PendienteAsignacion" },
        ["Pendiente"]               = new[] { "Confirmada", "Rechazada", "Cancelada", "PendienteAsignacion" },
        ["EnProceso"]               = new[] { "Completada", "Cancelada" },
    };

    public async Task<(bool Success, Cita? Cita, string? Error)> CambiarEstadoAsync(int id, string nuevoEstado)
    {
        var cita = await GetCitaByIdAsync(id);
        if (cita == null)
            return (false, null, "No encontrado");

        if (!_transicionesValidas.ContainsKey(nuevoEstado) && !nuevoEstado.Equals("Libre"))
            return (false, null, "Estado no válido.");

        if (_transicionesValidas.TryGetValue(cita.Estado, out var permitidos))
        {
            if (!permitidos.Contains(nuevoEstado))
                return (false, null, $"No se puede cambiar de '{cita.Estado}' a '{nuevoEstado}'.");
        }

        // Si es "Libre" desde ReservaTemporal, la borramos físicamente o la marcamos.
        if (nuevoEstado == "Libre")
        {
            _unitOfWork.Citas.Remove(cita);
        }
        else
        {
            cita.Estado = nuevoEstado;
            _unitOfWork.Citas.Update(cita);
        }
        
        await _unitOfWork.CommitAsync();
        
        return (true, cita, null);
    }
}
