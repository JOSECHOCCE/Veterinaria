using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Veterinaria.Application.Interfaces;
using Veterinaria.Domain.Contracts;
using Veterinaria.Domain.Entities;

namespace Veterinaria.Application.Services;

public class PostAtencionService : IPostAtencionService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly INotificacionService _notificacionService;

    public PostAtencionService(IUnitOfWork unitOfWork, INotificacionService notificacionService)
    {
        _unitOfWork = unitOfWork;
        _notificacionService = notificacionService;
    }

    public async Task<SeguimientoPostAtencion> ProgramarSeguimientoPostAtencionAsync(int historialClinicoId)
    {
        var historial = await _unitOfWork.HistorialesClinicos.GetAll()
            .Include(h => h.Cita)
            .ThenInclude(c => c.Mascota)
            .FirstOrDefaultAsync(h => h.Id == historialClinicoId);

        if (historial == null || historial.Cita == null)
        {
            throw new InvalidOperationException($"Historial clínico #{historialClinicoId} no encontrado.");
        }

        var clienteId = historial.Cita.Mascota != null ? historial.Cita.Mascota.UsuarioId : 0;

        var seguimiento = new SeguimientoPostAtencion
        {
            HistorialClinicoId = historialClinicoId,
            MascotaId = historial.Cita.MascotaId,
            ClienteId = clienteId,
            VeterinarioId = historial.Cita.VeterinarioId,
            FechaProgramada = DateTime.UtcNow.AddDays(1),
            Estado = "Pendiente",
            RequiereAtencionUrgente = false
        };

        await _unitOfWork.SeguimientosPostAtencion.AddAsync(seguimiento);
        await _unitOfWork.CommitAsync();

        return seguimiento;
    }

    public async Task<SeguimientoPostAtencion> RegistrarResultadoSeguimientoAsync(int seguimientoId, string estado, string? evolucion, string? notas, bool requiereAtencionUrgente)
    {
        var seguimiento = await _unitOfWork.SeguimientosPostAtencion.GetByIdAsync(seguimientoId);
        if (seguimiento == null)
        {
            throw new InvalidOperationException($"Seguimiento #{seguimientoId} no encontrado.");
        }

        seguimiento.Estado = estado;
        seguimiento.EvolucionPaciente = evolucion;
        seguimiento.NotasSeguimiento = notas;
        seguimiento.FechaContacto = DateTime.UtcNow;
        seguimiento.RequiereAtencionUrgente = requiereAtencionUrgente;

        _unitOfWork.SeguimientosPostAtencion.Update(seguimiento);

        // Si requiere atención urgente o estado "Revisión Requerida", enviar alerta al veterinario tratante
        if (requiereAtencionUrgente || estado == "Revisión Requerida")
        {
            if (seguimiento.VeterinarioId.HasValue)
            {
                try
                {
                    await _notificacionService.CrearNotificacionAsync(
                        seguimiento.VeterinarioId.Value,
                        "Alerta Post-Atención Urgente",
                        $"El paciente de la cita del seguimiento #{seguimientoId} presenta observaciones: {notas}",
                        "Warning",
                        "medical",
                        $"/admin/postatencion/{seguimientoId}"
                    );
                }
                catch
                {
                    // Fallback silencioso si falla notificación
                }
            }
        }

        await _unitOfWork.CommitAsync();
        return seguimiento;
    }

    public async Task<IEnumerable<SeguimientoPostAtencion>> ObtenerSeguimientosPendientesAsync()
    {
        return await _unitOfWork.SeguimientosPostAtencion.GetAll()
            .Include(s => s.Mascota)
            .Include(s => s.Cliente)
            .Where(s => s.Estado == "Pendiente" || s.Estado == "Revisión Requerida")
            .OrderBy(s => s.FechaProgramada)
            .ToListAsync();
    }

    public async Task<RecordatorioVacuna> ProgramarRecordatorioVacunaAsync(RecordatorioVacuna recordatorio)
    {
        if (recordatorio == null)
        {
            throw new ArgumentNullException(nameof(recordatorio));
        }

        recordatorio.Estado = "Programado";
        await _unitOfWork.RecordatoriosVacunas.AddAsync(recordatorio);
        await _unitOfWork.CommitAsync();

        return recordatorio;
    }

    public async Task<IEnumerable<RecordatorioVacuna>> ObtenerRecordatoriosPendientesAsync(int? clienteId = null)
    {
        var query = _unitOfWork.RecordatoriosVacunas.GetAll()
            .Include(r => r.Mascota)
            .Where(r => r.Estado == "Programado" || r.Estado == "Notificado");

        if (clienteId.HasValue)
        {
            query = query.Where(r => r.ClienteId == clienteId.Value);
        }

        return await query.OrderBy(r => r.FechaVencimiento).ToListAsync();
    }

    public async Task<int> ProcesarNotificacionesRecordatoriosDiariosAsync()
    {
        var limiteNotificacion = DateTime.UtcNow.AddDays(3);
        var recordatorios = await _unitOfWork.RecordatoriosVacunas.GetAll()
            .Include(r => r.Mascota)
            .Where(r => r.Estado == "Programado" && r.FechaVencimiento <= limiteNotificacion)
            .ToListAsync();

        int notificados = 0;
        foreach (var rec in recordatorios)
        {
            rec.Estado = "Notificado";
            rec.FechaEnvioNotificacion = DateTime.UtcNow;
            _unitOfWork.RecordatoriosVacunas.Update(rec);

            try
            {
                var nombreMascota = rec.Mascota != null ? rec.Mascota.Nombre : "su mascota";
                await _notificacionService.CrearNotificacionAsync(
                    rec.ClienteId,
                    "Recordatorio de Vacunación / Control",
                    $"Pronto vence la vacuna '{rec.NombreVacuna}' para {nombreMascota}. Fecha de refuerzo: {rec.FechaVencimiento:dd/MM/yyyy}.",
                    "Info",
                    "reminder",
                    "/portal/recordatorios"
                );
            }
            catch
            {
                // Fallback si la notificación falla
            }

            notificados++;
        }

        await _unitOfWork.CommitAsync();
        return notificados;
    }
}
