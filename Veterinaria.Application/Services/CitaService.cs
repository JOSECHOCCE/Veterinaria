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

    public CitaService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
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

        var horaCita = fechaHora.TimeOfDay;
        var horaFinCita = horaCita.Add(TimeSpan.FromMinutes(duracionMinutos));

        if (horaCita < veterinario.HorarioInicio || horaFinCita > veterinario.HorarioFin)
            return false;

        var fechaInicio = fechaHora.Date;
        var fechaFin = fechaInicio.AddDays(1);

        var citasDelDia = await _unitOfWork.Citas.GetAll()
            .Include(c => c.Servicio)
            .Where(c => c.VeterinarioId == veterinarioId
                     && c.FechaHora >= fechaInicio
                     && c.FechaHora < fechaFin
                     && c.Estado != "Cancelada"
                     && (citaIdExcluir == null || c.Id != citaIdExcluir))
            .ToListAsync();

        var inicioCitaNueva = fechaHora;
        var finCitaNueva = fechaHora.AddMinutes(duracionMinutos);

        foreach (var citaExistente in citasDelDia)
        {
            var duracionExistente = citaExistente.Servicio?.DuracionMinutos ?? 30;
            var inicioCitaExistente = citaExistente.FechaHora;
            var finCitaExistente = citaExistente.FechaHora.AddMinutes(duracionExistente);

            bool hayConflicto = !(finCitaNueva <= inicioCitaExistente || inicioCitaNueva >= finCitaExistente);
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

        var citasConPagoPendiente = await _unitOfWork.Citas.GetAll()
            .Where(c => citaIds.Contains(c.Id) && c.EstadoPago == "Parcial" && c.Estado == "Completada")
            .AnyAsync();

        return citasConPagoPendiente;
    }

    public async Task<List<DateTime>> ObtenerHorariosDisponiblesAsync(int veterinarioId, DateTime fecha)
    {
        var horariosDisponibles = new List<DateTime>();
        var veterinario = await _unitOfWork.Veterinarios.GetByIdAsync(veterinarioId);
        if (veterinario == null || !veterinario.Activo)
            return horariosDisponibles;

        var slotDuracion = 30;
        var fechaBase = fecha.Date;
        var horaActual = veterinario.HorarioInicio;

        while (horaActual.Add(TimeSpan.FromMinutes(slotDuracion)) <= veterinario.HorarioFin)
        {
            var slotDateTime = fechaBase.Add(horaActual);
            
            if (fecha.Date == DateTime.Today && slotDateTime <= DateTime.Now)
            {
                horaActual = horaActual.Add(TimeSpan.FromMinutes(slotDuracion));
                continue;
            }

            horariosDisponibles.Add(slotDateTime);
            horaActual = horaActual.Add(TimeSpan.FromMinutes(slotDuracion));
        }

        var fechaInicio = fechaBase;
        var fechaFin = fechaBase.AddDays(1);

        var citasDelDia = await _unitOfWork.Citas.GetAll()
            .Include(c => c.Servicio)
            .Where(c => c.VeterinarioId == veterinarioId
                     && c.FechaHora >= fechaInicio
                     && c.FechaHora < fechaFin
                     && c.Estado != "Cancelada")
            .ToListAsync();

        foreach (var cita in citasDelDia)
        {
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

        var horaCita = fechaHora.TimeOfDay;
        if (horaCita < veterinario.HorarioInicio)
            return (false, $"La hora de la cita ({horaCita:hh\\:mm}) es antes del horario de inicio del veterinario ({veterinario.HorarioInicio:hh\\:mm}).");

        if (horaCita >= veterinario.HorarioFin)
            return (false, $"La hora de la cita ({horaCita:hh\\:mm}) es después del horario de fin del veterinario ({veterinario.HorarioFin:hh\\:mm}).");

        if (fechaHora.DayOfWeek == DayOfWeek.Sunday)
            return (false, "No se pueden programar citas los domingos.");

        return (true, null);
    }

    public async Task<Mascota> CreateMascotaAsync(Mascota mascota)
    {
        await _unitOfWork.Mascotas.AddAsync(mascota);
        await _unitOfWork.CommitAsync();
        return mascota;
    }

    public async Task<Cita> CreateCitaAsync(Cita cita, decimal precioServicio)
    {
        cita.Estado = "Pendiente";
        cita.EstadoPago = "Pendiente";
        cita.MontoTotal = precioServicio;
        cita.MontoPagado = 0;
        cita.FechaCreacion = DateTime.UtcNow;

        await _unitOfWork.Citas.AddAsync(cita);
        await _unitOfWork.CommitAsync();
        return cita;
    }

    public async Task<(bool Success, Cita? Cita)> EditCitaAsync(int id, string nuevoEstado, string? motivo)
    {
        var cita = await GetCitaByIdAsync(id);
        if (cita == null)
            return (false, null);

        cita.Estado = nuevoEstado;
        cita.Motivo = motivo;

        _unitOfWork.Citas.Update(cita);
        await _unitOfWork.CommitAsync();
        return (true, cita);
    }

    public async Task<(bool Success, Cita? Cita, string? Error)> CancelarCitaAsync(int id, bool isAdmin, int? currentUsuarioId)
    {
        var cita = await GetCitaByIdAsync(id);
        if (cita == null)
            return (false, null, "No encontrado");

        if (!isAdmin && (currentUsuarioId == null || cita.Mascota.UsuarioId != currentUsuarioId))
            return (false, null, "Forbid");

        if (cita.Estado != "Pendiente" && cita.Estado != "Confirmada")
            return (false, null, "Solo se pueden cancelar citas en estado 'Pendiente' o 'Confirmada'.");

        cita.Estado = "Cancelada";
        _unitOfWork.Citas.Update(cita);
        await _unitOfWork.CommitAsync();

        return (true, cita, null);
    }

    public async Task<(bool Success, Cita? Cita)> CompletarCitaAsync(int id)
    {
        var cita = await GetCitaByIdAsync(id);
        if (cita == null)
            return (false, null);

        cita.Estado = "Completada";
        _unitOfWork.Citas.Update(cita);
        await _unitOfWork.CommitAsync();
        return (true, cita);
    }

    public async Task<(bool Success, Cita? Cita, string? Error)> CambiarEstadoAsync(int id, string nuevoEstado)
    {
        var cita = await GetCitaByIdAsync(id);
        if (cita == null)
            return (false, null, "No encontrado");

        var estadosValidos = new[] { "Pendiente", "Confirmada", "EnProceso", "Completada", "Cancelada" };
        if (!estadosValidos.Contains(nuevoEstado))
            return (false, null, "Estado no válido.");

        cita.Estado = nuevoEstado;
        _unitOfWork.Citas.Update(cita);
        await _unitOfWork.CommitAsync();
        
        return (true, cita, null);
    }
}
