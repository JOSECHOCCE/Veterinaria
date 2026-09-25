using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Veterinaria.Application.Interfaces;
using Veterinaria.Domain.Contracts;
using Veterinaria.Domain.Entities;

namespace Veterinaria.Application.Services;

public class HistorialClinicoService : IHistorialClinicoService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly INotificacionService _notificacionService;

    public HistorialClinicoService(IUnitOfWork unitOfWork, INotificacionService notificacionService)
    {
        _unitOfWork = unitOfWork;
        _notificacionService = notificacionService;
    }

    public async Task<Mascota?> GetMascotaWithUsuarioAsync(int mascotaId)
    {
        return await _unitOfWork.Mascotas.GetAll()
            .Include(m => m.Usuario)
            .FirstOrDefaultAsync(m => m.Id == mascotaId);
    }

    // T8 SHOULD (decisión documentada): el historial del cliente solo expone atenciones
    // Cerradas; los borradores (Cerrado=false) solo los ve el equipo interno con
    // incluirBorradores:true. El portal cliente filtra por su cuenta (doble seguro).
    public async Task<List<HistorialClinico>> GetHistorialesByMascotaIdAsync(int mascotaId, bool incluirBorradores = false)
    {
        var query = _unitOfWork.HistorialesClinicos.GetAll()
            .Include(h => h.Cita)
                .ThenInclude(c => c.Veterinario)
            .Include(h => h.Cita)
                .ThenInclude(c => c.Servicio)
            .Where(h => h.Cita.MascotaId == mascotaId);

        if (!incluirBorradores)
            query = query.Where(h => h.Cerrado);

        return await query
            .OrderByDescending(h => h.Cita.FechaHora)
            .ToListAsync();
    }

    public async Task<Cita?> GetCitaForHistorialAsync(int citaId)
    {
        return await _unitOfWork.Citas.GetAll()
            .Include(c => c.Mascota)
                .ThenInclude(m => m.Usuario)
            .Include(c => c.Veterinario)
            .Include(c => c.Servicio)
            .FirstOrDefaultAsync(c => c.Id == citaId);
    }

    public async Task<bool> ExistsHistorialForCitaAsync(int citaId)
    {
        return await _unitOfWork.HistorialesClinicos.GetAll()
            .AnyAsync(h => h.CitaId == citaId);
    }

    public async Task<HistorialClinico?> GetHistorialByCitaIdAsync(int citaId)
    {
        return await _unitOfWork.HistorialesClinicos.GetAll()
            .AsTracking()
            .Include(h => h.Cita)
                .ThenInclude(c => c.Mascota)
                    .ThenInclude(m => m.Usuario)
            .Include(h => h.Cita)
                .ThenInclude(c => c.Veterinario)
            .Include(h => h.Cita)
                .ThenInclude(c => c.Servicio)
            .FirstOrDefaultAsync(h => h.CitaId == citaId);
    }

    public async Task<HistorialClinico?> GetHistorialByIdAsync(int id)
    {
        return await _unitOfWork.HistorialesClinicos.GetAll()
            .AsTracking()
            .Include(h => h.Cita)
                .ThenInclude(c => c.Mascota)
                    .ThenInclude(m => m.Usuario)
            .Include(h => h.Cita)
                .ThenInclude(c => c.Veterinario)
            .Include(h => h.Cita)
                .ThenInclude(c => c.Servicio)
            .FirstOrDefaultAsync(h => h.Id == id);
    }

    public async Task<(bool Success, HistorialClinico? Historial, string? Error)> GuardarBorradorAsync(HistorialClinico historial, string? userEmail, bool isAdmin)
    {
        var cita = await GetCitaForHistorialAsync(historial.CitaId);
        if (cita == null) return (false, null, "Cita no encontrada.");
        
        // RF-41 / Regla 2: La cita debe estar En Atención para empezar el registro (o Completada si el admin lo fuerza)
        if (cita.Estado != "EnAtencion" && cita.Estado != "EnProceso" && cita.Estado != "Completada")
            return (false, null, "La cita debe estar 'En Atención' para registrar la historia clínica.");

        // Regla 3: Solo veterinario asignado puede registrar
        if (!isAdmin && cita.Veterinario != null && cita.Veterinario.Email != userEmail)
            return (false, null, "Solo el veterinario asignado a la cita puede registrar la atención.");

        var existente = await ExistsHistorialForCitaAsync(historial.CitaId);
        if (existente)
            return (false, null, "Ya existe un historial para esta cita.");

        historial.FechaRegistro = DateTime.UtcNow;
        historial.Cerrado = false;
        
        if (historial.PesoActual.HasValue)
        {
            var mascota = await _unitOfWork.Mascotas.GetByIdAsync(cita.MascotaId);
            if (mascota != null)
            {
                mascota.Peso = historial.PesoActual;
            }
        }

        await _unitOfWork.HistorialesClinicos.AddAsync(historial);
        await _unitOfWork.CommitAsync();

        return (true, historial, null);
    }

    public async Task<(bool Success, HistorialClinico? Historial, string? Error)> ActualizarBorradorAsync(HistorialClinico historialDto, string? userEmail, bool isAdmin)
    {
        var historial = await GetHistorialByIdAsync(historialDto.Id);
        if (historial == null) return (false, null, "Historial no encontrado.");

        // Regla 4: Una vez cerrada, queda en solo lectura
        if (historial.Cerrado)
            return (false, null, "La atención clínica ya fue cerrada y es de solo lectura.");

        // Regla 3: Solo el veterinario asignado puede editar mientras está abierta
        if (!isAdmin && historial.Cita.Veterinario != null && historial.Cita.Veterinario.Email != userEmail)
            return (false, null, "Solo el veterinario asignado a la cita puede editar la atención.");

        historial.Diagnostico = historialDto.Diagnostico ?? historial.Diagnostico;
        historial.Tratamiento = historialDto.Tratamiento ?? historial.Tratamiento;
        historial.Medicamentos = historialDto.Medicamentos ?? historial.Medicamentos;
        historial.Observaciones = historialDto.Observaciones ?? historial.Observaciones;
        historial.MotivoConsulta = historialDto.MotivoConsulta ?? historial.MotivoConsulta;
        historial.Hallazgos = historialDto.Hallazgos ?? historial.Hallazgos;
        historial.Recomendaciones = historialDto.Recomendaciones ?? historial.Recomendaciones;
        historial.ProximoControl = historialDto.ProximoControl ?? historial.ProximoControl;
        historial.PesoActual = historialDto.PesoActual;
        historial.Temperatura = historialDto.Temperatura ?? historial.Temperatura;
        historial.FrecuenciaCardiaca = historialDto.FrecuenciaCardiaca ?? historial.FrecuenciaCardiaca;

        // SOAP fields (RF-014)
        historial.Subjetivo = historialDto.Subjetivo ?? historial.Subjetivo;
        historial.Objetivo = historialDto.Objetivo ?? historial.Objetivo;
        historial.Analisis = historialDto.Analisis ?? historial.Analisis;
        historial.Plan = historialDto.Plan ?? historial.Plan;

        if (historial.PesoActual.HasValue && historial.Cita?.Mascota != null)
        {
            historial.Cita.Mascota.Peso = historial.PesoActual;
        }

        await _unitOfWork.CommitAsync();
        return (true, historial, null);
    }

    public async Task<(bool Success, HistorialClinico? Historial, string? Error)> AgregarAddendumAsync(int historialId, string nota, string userEmail, bool isAdmin)
    {
        var historial = await GetHistorialByIdAsync(historialId);
        if (historial == null) return (false, null, "Historial no encontrado.");

        if (!historial.Cerrado) return (false, null, "Solo se pueden agregar notas aclaratorias a historiales cerrados.");

        var timestamp = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm UTC");
        var addendumEntry = $"[{timestamp} por {userEmail}]: {nota}";

        if (string.IsNullOrWhiteSpace(historial.Addendum))
        {
            historial.Addendum = addendumEntry;
        }
        else
        {
            historial.Addendum += "\n" + addendumEntry;
        }

        await _unitOfWork.CommitAsync();
        return (true, historial, null);
    }

    public async Task<(bool Success, string? Error)> CerrarAtencionAsync(int citaId, string? userEmail, bool isAdmin)
    {
        var historial = await GetHistorialByCitaIdAsync(citaId);
        if (historial == null) return (false, "Historial no encontrado.");

        if (historial.Cerrado) return (false, "La atención ya se encuentra cerrada.");

        if (!isAdmin && historial.Cita?.Veterinario != null && historial.Cita.Veterinario.Email != userEmail)
            return (false, "Solo el veterinario asignado puede cerrar la atención.");

        var cita = historial.Cita;
        if (cita == null) return (false, "Cita asociada no encontrada.");

        // Rule: Surgical / Anesthetic / Hospitalization services require an accepted consent form
        var servicioNombre = cita.Servicio?.Nombre?.ToLower() ?? "";
        bool esProcedimientoAltoRiesgo = servicioNombre.Contains("cirugía") || servicioNombre.Contains("cirugia") ||
                                          servicioNombre.Contains("anestesia") || servicioNombre.Contains("hospitalización");

        if (esProcedimientoAltoRiesgo)
        {
            var tieneConsentimientoAceptado = await _unitOfWork.Consentimientos.GetAll()
                .AnyAsync(c => c.MascotaId == cita.MascotaId && c.Aceptado);

            if (!tieneConsentimientoAceptado)
            {
                return (false, "Este procedimiento requiere un consentimiento informado firmado y aceptado antes de cerrar la atención.");
            }
        }

        historial.Cerrado = true;

        if (cita.Estado == "EnAtencion" || cita.Estado == "EnProceso")
        {
            cita.Estado = "Completada";
        }

        // Update associated Triage status to "Atendido"
        var triage = await _unitOfWork.Triages.GetAll()
            .AsTracking()
            .FirstOrDefaultAsync(t => t.CitaId == citaId && (t.Estado == "EnEspera" || t.Estado == "EnAtencion"));
        if (triage != null)
        {
            triage.Estado = "Atendido";
        }

        // RF-018: Auto-generate pending OrdenCobro / Pago for reception/caja
        var existePago = await _unitOfWork.Pagos.GetAll().AnyAsync(p => p.CitaId == citaId);
        if (!existePago)
        {
            // Calculate total: Cita base fee + Accepted budgets + In-house prescription items
            decimal montoTotal = cita.MontoTotal;

            // Add accepted budget items
            var presupuestosAceptados = await _unitOfWork.Presupuestos.GetAll()
                .Where(p => p.CitaId == citaId && p.Estado == "Aceptado")
                .SumAsync(p => (decimal?)p.MontoTotal) ?? 0m;

            montoTotal += presupuestosAceptados;

            // Add in-house prescription items
            var receta = await _unitOfWork.Recetas.GetAll()
                .Include(r => r.Items)
                    .ThenInclude(i => i.Producto)
                .FirstOrDefaultAsync(r => r.HistorialClinicoId == historial.Id);

            if (receta != null && receta.Items != null)
            {
                var montoRecetaInterna = receta.Items
                    .Where(i => i.EsStockInterno && i.Producto != null)
                    .Sum(i => i.CantidadPrescrita * (i.Producto?.Precio ?? 0m));

                montoTotal += montoRecetaInterna;
            }

            var nuevoPago = new Pago
            {
                CitaId = cita.Id,
                Monto = montoTotal,
                MetodoPago = "Pendiente",
                TipoPago = "Completo",
                Observacion = "Orden de cobro generada automáticamente al cerrar atención médica.",
                FechaPago = DateTime.UtcNow
            };

            await _unitOfWork.Pagos.AddAsync(nuevoPago);
        }

        await _unitOfWork.CommitAsync();

        if (cita != null)
        {
            await _notificacionService.NotificarCitaCompletadaAsync(cita);
        }

        return (true, null);
    }
}
