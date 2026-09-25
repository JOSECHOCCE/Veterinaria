using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Veterinaria.Application.Interfaces;
using Veterinaria.Domain.Contracts;
using Veterinaria.Domain.Entities;

namespace Veterinaria.Application.Services;

public class TriageService : ITriageService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IRealTimeNotificationService _realTimeService;

    public TriageService(IUnitOfWork unitOfWork, IRealTimeNotificationService realTimeService)
    {
        _unitOfWork = unitOfWork;
        _realTimeService = realTimeService;
    }

    public async Task<List<Triage>> GetColaTriageAsync()
    {
        return await _unitOfWork.Triages.GetAll()
            .Include(t => t.Mascota)
                .ThenInclude(m => m.Usuario)
            .Where(t => t.Estado == "EnEspera" || t.Estado == "EnAtencion")
            .OrderBy(t => t.Nivel == "N1" ? 0 : t.Nivel == "N2" ? 1 : 2)
            .ThenBy(t => t.FechaRegistro)
            .ToListAsync();
    }

    public async Task AddTriageAsync(Triage triage)
    {
        await _unitOfWork.Triages.AddAsync(triage);
        await _unitOfWork.CommitAsync();
        await _realTimeService.SendTriageQueueUpdatedAsync();
    }

    public async Task<Triage?> GetTriageByIdAsync(int id)
    {
        return await _unitOfWork.Triages.GetByIdAsync(id);
    }

    public async Task UpdateTriageAsync(Triage triage)
    {
        _unitOfWork.Triages.Update(triage);
        await _unitOfWork.CommitAsync();
    }

    public async Task<Triage> RegistrarSignosVitalesAsync(int triageId, string nivel, string? sintomas, decimal? temperatura, int? fc, decimal? peso)
    {
        var triage = await _unitOfWork.Triages.GetByIdAsync(triageId);
        if (triage == null)
            throw new KeyNotFoundException($"Triaje con ID {triageId} no encontrado.");

        triage.Nivel = nivel;
        triage.PrioridadColor = nivel switch
        {
            "N1" => "Rojo",
            "N2" => "Naranja",
            _ => "Verde"
        };
        triage.Sintomas = sintomas ?? triage.Sintomas;
        triage.Temperatura = temperatura;
        triage.FrecuenciaCardiaca = fc;
        triage.PesoEstimado = peso;

        _unitOfWork.Triages.Update(triage);
        await _unitOfWork.CommitAsync();
        await _realTimeService.SendTriageQueueUpdatedAsync();
        return triage;
    }

    public async Task<Triage> CambiarEstadoTriageAsync(int triageId, string nuevoEstado, string? consultorio = null)
    {
        var triage = await _unitOfWork.Triages.GetByIdAsync(triageId);
        if (triage == null)
            throw new KeyNotFoundException($"Triaje con ID {triageId} no encontrado.");

        triage.Estado = nuevoEstado;
        if (!string.IsNullOrWhiteSpace(consultorio))
        {
            triage.Consultorio = consultorio;
        }

        _unitOfWork.Triages.Update(triage);

        // Si la cita está vinculada, actualizar también el estado de la cita
        if (triage.CitaId.HasValue)
        {
            var cita = await _unitOfWork.Citas.GetByIdAsync(triage.CitaId.Value);
            if (cita != null)
            {
                if (nuevoEstado == "EnAtencion")
                {
                    cita.Estado = "EnAtencion";
                    _unitOfWork.Citas.Update(cita);
                }
                else if (nuevoEstado == "Atendido")
                {
                    cita.Estado = "Completada";
                    _unitOfWork.Citas.Update(cita);
                }
            }
        }

        await _unitOfWork.CommitAsync();
        await _realTimeService.SendTriageQueueUpdatedAsync();
        return triage;
    }

    public async Task<List<Mascota>> GetMascotasActivasConUsuarioAsync()
    {
        return await _unitOfWork.Mascotas.GetAll()
            .Include(m => m.Usuario)
            .Where(m => m.Activo)
            .OrderBy(m => m.Nombre)
            .ToListAsync();
    }
}
