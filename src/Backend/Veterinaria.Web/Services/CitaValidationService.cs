using Microsoft.EntityFrameworkCore;
using Veterinaria.Domain.Contracts;

namespace Veterinaria.Web.Services;

public interface ICitaValidationService
{
    /// <summary>
    /// Verifica si el veterinario está disponible en la fecha/hora indicada
    /// </summary>
    Task<bool> VeterinarioDisponibleAsync(int veterinarioId, DateTime fechaHora, int duracionMinutos, int? citaIdExcluir = null);

    /// <summary>
    /// Verifica si la mascota tiene pagos pendientes
    /// </summary>
    Task<bool> MascotaTienePagosPendientesAsync(int mascotaId);

    /// <summary>
    /// Obtiene los horarios disponibles de un veterinario para una fecha
    /// </summary>
    Task<List<DateTime>> ObtenerHorariosDisponiblesAsync(int veterinarioId, DateTime fecha);

    /// <summary>
    /// Valida que la fecha de la cita sea válida (no pasada, dentro de horario laboral)
    /// </summary>
    Task<(bool EsValida, string? MensajeError)> ValidarFechaCitaAsync(int veterinarioId, DateTime fechaHora);
}

public class CitaValidationService : ICitaValidationService
{
    private readonly IUnitOfWork _unitOfWork;

    public CitaValidationService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<bool> VeterinarioDisponibleAsync(int veterinarioId, DateTime fechaHora, int duracionMinutos, int? citaIdExcluir = null)
    {
        // 1. Obtener el veterinario para verificar su horario
        var veterinario = await _unitOfWork.Veterinarios.GetByIdAsync(veterinarioId);
        if (veterinario == null || !veterinario.Activo)
            return false;

        // 2. Verificar que la hora esté dentro del horario del veterinario
        var horaCita = fechaHora.TimeOfDay;
        var horaFinCita = horaCita.Add(TimeSpan.FromMinutes(duracionMinutos));

        if (horaCita < veterinario.HorarioInicio || horaFinCita > veterinario.HorarioFin)
            return false;

        // 3. Buscar citas conflictivas del mismo veterinario en la misma fecha
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

        // 4. Verificar conflictos de horario
        var inicioCitaNueva = fechaHora;
        var finCitaNueva = fechaHora.AddMinutes(duracionMinutos);

        foreach (var citaExistente in citasDelDia)
        {
            var duracionExistente = citaExistente.Servicio?.DuracionMinutos ?? 30;
            var inicioCitaExistente = citaExistente.FechaHora;
            var finCitaExistente = citaExistente.FechaHora.AddMinutes(duracionExistente);

            // Verificar solapamiento: hay conflicto si los rangos se superponen
            bool hayConflicto = !(finCitaNueva <= inicioCitaExistente || inicioCitaNueva >= finCitaExistente);

            if (hayConflicto)
                return false;
        }

        return true;
    }

    public async Task<bool> MascotaTienePagosPendientesAsync(int mascotaId)
    {
        // Buscar citas de la mascota
        var citaIds = await _unitOfWork.Citas.GetAll()
            .Where(c => c.MascotaId == mascotaId)
            .Select(c => c.Id)
            .ToListAsync();

        if (!citaIds.Any())
            return false;

        // Verificar si hay citas con pago parcial pendiente
        var citasConPagoPendiente = await _unitOfWork.Citas.GetAll()
            .Where(c => citaIds.Contains(c.Id) && c.EstadoPago == "Parcial" && c.Estado == "Completada")
            .AnyAsync();

        return citasConPagoPendiente;
    }

    public async Task<List<DateTime>> ObtenerHorariosDisponiblesAsync(int veterinarioId, DateTime fecha)
    {
        var horariosDisponibles = new List<DateTime>();

        // 1. Obtener el veterinario
        var veterinario = await _unitOfWork.Veterinarios.GetByIdAsync(veterinarioId);
        if (veterinario == null || !veterinario.Activo)
            return horariosDisponibles;

        // 2. Generar slots de 30 minutos
        var slotDuracion = 30; // minutos
        var fechaBase = fecha.Date;
        var horaActual = veterinario.HorarioInicio;

        while (horaActual.Add(TimeSpan.FromMinutes(slotDuracion)) <= veterinario.HorarioFin)
        {
            var slotDateTime = fechaBase.Add(horaActual);
            
            // Solo agregar slots futuros si es hoy
            if (fecha.Date == DateTime.Today && slotDateTime <= DateTime.Now)
            {
                horaActual = horaActual.Add(TimeSpan.FromMinutes(slotDuracion));
                continue;
            }

            horariosDisponibles.Add(slotDateTime);
            horaActual = horaActual.Add(TimeSpan.FromMinutes(slotDuracion));
        }

        // 3. Obtener citas existentes del día
        var fechaInicio = fechaBase;
        var fechaFin = fechaBase.AddDays(1);

        var citasDelDia = await _unitOfWork.Citas.GetAll()
            .Include(c => c.Servicio)
            .Where(c => c.VeterinarioId == veterinarioId
                     && c.FechaHora >= fechaInicio
                     && c.FechaHora < fechaFin
                     && c.Estado != "Cancelada")
            .ToListAsync();

        // 4. Remover horarios ocupados
        foreach (var cita in citasDelDia)
        {
            var duracionCita = cita.Servicio?.DuracionMinutos ?? 30;

            var inicioCita = cita.FechaHora;
            var finCita = cita.FechaHora.AddMinutes(duracionCita);

            // Remover todos los slots que se solapan con esta cita
            horariosDisponibles.RemoveAll(slot =>
            {
                var finSlot = slot.AddMinutes(slotDuracion);
                // Hay solapamiento si: !(finSlot <= inicioCita || slot >= finCita)
                return !(finSlot <= inicioCita || slot >= finCita);
            });
        }

        return horariosDisponibles.OrderBy(h => h).ToList();
    }

    public async Task<(bool EsValida, string? MensajeError)> ValidarFechaCitaAsync(int veterinarioId, DateTime fechaHora)
    {
        // 1. No permitir citas en el pasado
        if (fechaHora < DateTime.Now)
        {
            return (false, "No se pueden programar citas en fechas pasadas.");
        }

        // 2. No permitir citas con más de 3 meses de anticipación
        if (fechaHora > DateTime.Now.AddMonths(3))
        {
            return (false, "No se pueden programar citas con más de 3 meses de anticipación.");
        }

        // 3. Obtener veterinario y verificar horario
        var veterinario = await _unitOfWork.Veterinarios.GetByIdAsync(veterinarioId);
        if (veterinario == null)
        {
            return (false, "Veterinario no encontrado.");
        }

        if (!veterinario.Activo)
        {
            return (false, "El veterinario seleccionado no está activo.");
        }

        var horaCita = fechaHora.TimeOfDay;
        if (horaCita < veterinario.HorarioInicio)
        {
            return (false, $"La hora de la cita ({horaCita:hh\\:mm}) es antes del horario de inicio del veterinario ({veterinario.HorarioInicio:hh\\:mm}).");
        }

        if (horaCita >= veterinario.HorarioFin)
        {
            return (false, $"La hora de la cita ({horaCita:hh\\:mm}) es después del horario de fin del veterinario ({veterinario.HorarioFin:hh\\:mm}).");
        }

        // 4. No permitir citas en domingo (opcional, se puede configurar)
        if (fechaHora.DayOfWeek == DayOfWeek.Sunday)
        {
            return (false, "No se pueden programar citas los domingos.");
        }

        return (true, null);
    }
}
