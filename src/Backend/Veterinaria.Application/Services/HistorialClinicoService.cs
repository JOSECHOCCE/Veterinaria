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

    public HistorialClinicoService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Mascota?> GetMascotaWithUsuarioAsync(int mascotaId)
    {
        return await _unitOfWork.Mascotas.GetAll()
            .Include(m => m.Usuario)
            .FirstOrDefaultAsync(m => m.Id == mascotaId);
    }

    public async Task<List<HistorialClinico>> GetHistorialesByMascotaIdAsync(int mascotaId)
    {
        return await _unitOfWork.HistorialesClinicos.GetAll()
            .Include(h => h.Cita)
                .ThenInclude(c => c.Veterinario)
            .Include(h => h.Cita)
                .ThenInclude(c => c.Servicio)
            .Where(h => h.Cita.MascotaId == mascotaId && h.Cerrado) // Historiales cerrados visibles (RF-42) o todos? Mostrar todos, pero el cliente no debería ver borradores. Dejémoslo todos por ahora, el controller filtra si es cliente.
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
                _unitOfWork.Mascotas.Update(mascota);
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

        historial.Diagnostico = historialDto.Diagnostico;
        historial.Tratamiento = historialDto.Tratamiento;
        historial.Medicamentos = historialDto.Medicamentos;
        historial.Observaciones = historialDto.Observaciones;
        historial.MotivoConsulta = historialDto.MotivoConsulta;
        historial.Hallazgos = historialDto.Hallazgos;
        historial.Recomendaciones = historialDto.Recomendaciones;
        historial.ProximoControl = historialDto.ProximoControl;
        historial.PesoActual = historialDto.PesoActual;
        historial.Temperatura = historialDto.Temperatura;
        historial.FrecuenciaCardiaca = historialDto.FrecuenciaCardiaca;

        if (historial.PesoActual.HasValue)
        {
            var mascota = await _unitOfWork.Mascotas.GetByIdAsync(historial.Cita.MascotaId);
            if (mascota != null)
            {
                mascota.Peso = historial.PesoActual;
                _unitOfWork.Mascotas.Update(mascota);
            }
        }

        _unitOfWork.HistorialesClinicos.Update(historial);
        await _unitOfWork.CommitAsync();
        return (true, historial, null);
    }

    public async Task<(bool Success, string? Error)> CerrarAtencionAsync(int citaId, string? userEmail, bool isAdmin)
    {
        var historial = await GetHistorialByCitaIdAsync(citaId);
        if (historial == null) return (false, "Historial no encontrado.");

        if (historial.Cerrado) return (false, "La atención ya se encuentra cerrada.");

        if (!isAdmin && historial.Cita.Veterinario != null && historial.Cita.Veterinario.Email != userEmail)
            return (false, "Solo el veterinario asignado puede cerrar la atención.");

        historial.Cerrado = true;
        _unitOfWork.HistorialesClinicos.Update(historial);

        // RF-41: Cerrar atención clínica cambia estado de cita a Completada
        var cita = historial.Cita;
        if (cita.Estado == "EnAtencion" || cita.Estado == "EnProceso")
        {
            cita.Estado = "Completada";
            _unitOfWork.Citas.Update(cita);
        }

        await _unitOfWork.CommitAsync();
        return (true, null);
    }
}
