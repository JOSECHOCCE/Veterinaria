using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Veterinaria.Application.DTOs;
using Veterinaria.Application.Interfaces;
using Veterinaria.Domain.Contracts;
using Veterinaria.Domain.Entities;

namespace Veterinaria.Application.Services;

public class MascotaService : IMascotaService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditoriaService _auditoriaService;

    public MascotaService(IUnitOfWork unitOfWork, IAuditoriaService auditoriaService)
    {
        _unitOfWork = unitOfWork;
        _auditoriaService = auditoriaService;
    }

    public async Task<(List<Mascota> Mascotas, int Total)> GetMascotasPaginatedAsync(string? q, int page, string userId, bool isCliente)
    {
        var query = _unitOfWork.Mascotas.GetAll()
            .Include(m => m.Usuario)
            .Where(m => m.Activo)
            .AsQueryable();

        if (isCliente)
        {
            var usuario = await _unitOfWork.Usuarios.GetAll()
                .FirstOrDefaultAsync(u => u.ApplicationUserId == userId);

            if (usuario != null)
            {
                query = query.Where(m => m.UsuarioId == usuario.Id);
            }
            else
            {
                query = query.Where(m => false); // Si no hay perfil, no retorna nada
            }
        }

        if (!string.IsNullOrWhiteSpace(q))
        {
            q = q.ToLower();
            query = query.Where(m => m.Nombre.ToLower().Contains(q) ||
                                     m.Especie.ToLower().Contains(q));
        }

        var total = await query.CountAsync();
        var mascotas = await query.OrderBy(m => m.Nombre)
            .Skip((page - 1) * 10)
            .Take(10)
            .ToListAsync();

        return (mascotas, total);
    }

    public async Task<Mascota?> GetMascotaWithDetailsAsync(int id)
    {
        return await _unitOfWork.Mascotas.GetAll()
            .Include(m => m.Usuario)
            .Include(m => m.Citas)
                .ThenInclude(c => c.Servicio)
            .Include(m => m.Citas)
                .ThenInclude(c => c.Veterinario)
            .Include(m => m.Citas)
                .ThenInclude(c => c.Historial)
            .FirstOrDefaultAsync(m => m.Id == id);
    }

    public async Task<Mascota?> GetMascotaByIdAsync(int id)
    {
        return await _unitOfWork.Mascotas.GetByIdAsync(id);
    }

    public async Task<MascotaAlertasDto> GetAlertasMascotaAsync(int id)
    {
        var mascota = await GetMascotaWithDetailsAsync(id);
        if (mascota == null) return new MascotaAlertasDto();

        var ultimaVacuna = mascota.Citas
            .Where(c => c.Estado == "Completada" && 
                       (c.Servicio.Nombre.ToLower().Contains("vacuna") || 
                        (c.Historial != null && (c.Historial.Tratamiento ?? "").ToLower().Contains("vacuna"))))
            .OrderByDescending(c => c.FechaHora)
            .Select(c => c.FechaHora.ToString("dd/MM/yyyy"))
            .FirstOrDefault();

        return new MascotaAlertasDto
        {
            Alergias = mascota.AlergiasConocidas ?? "Ninguna registrada",
            CondicionCronica = (mascota.ObservacionesGenerales ?? "").ToLower().Contains("crónic") || 
                               (mascota.ObservacionesGenerales ?? "").ToLower().Contains("cronic")
                               ? mascota.ObservacionesGenerales 
                               : "Ninguna identificada",
            UltimaVacuna = ultimaVacuna ?? "Ninguna registrada"
        };
    }

    public async Task<Response<Mascota>> CrearMascotaAsync(CrearMascotaDto dto, string userId, bool isAdmin)
    {
        var usuarioLogueado = await _unitOfWork.Usuarios.GetAll()
            .FirstOrDefaultAsync(u => u.ApplicationUserId == userId);

        if (usuarioLogueado != null && (!isAdmin || dto.UsuarioId == 0))
        {
            dto.UsuarioId = usuarioLogueado.Id;
        }
        else if (dto.UsuarioId == 0)
        {
            dto.UsuarioId = 1; // Fallback para Admin si no seleccionó propietario
        }

        var mascota = new Mascota
        {
            Nombre = dto.Nombre,
            Especie = dto.Especie,
            Raza = dto.Raza,
            FechaNacimiento = dto.FechaNacimiento,
            Peso = dto.Peso,
            Color = dto.Color,
            FotoUrl = dto.FotoUrl,
            UsuarioId = dto.UsuarioId,
            Sexo = dto.Sexo,
            ObservacionesGenerales = dto.ObservacionesGenerales,
            AlergiasConocidas = dto.AlergiasConocidas,
            Activo = true
        };

        await _unitOfWork.Mascotas.AddAsync(mascota);
        await _unitOfWork.CommitAsync();

        await _auditoriaService.RegistrarAccionAsync(
            "Crear",
            "Mascota",
            mascota.Id.ToString(),
            $"Se registró la mascota '{mascota.Nombre}' para el UsuarioId {mascota.UsuarioId}."
        );

        return Response<Mascota>.Ok(mascota, "Mascota creada exitosamente.");
    }

    public async Task<Response<Mascota>> EditarMascotaAsync(int id, EditarMascotaDto dto)
    {
        if (id != dto.Id) return Response<Mascota>.Fail("El ID no coincide.");

        var mascota = await _unitOfWork.Mascotas.GetByIdAsync(id);
        if (mascota == null) return Response<Mascota>.Fail("Mascota no encontrada.");

        var oldUsuarioId = mascota.UsuarioId;

        mascota.Nombre = dto.Nombre;
        mascota.Especie = dto.Especie;
        mascota.Raza = dto.Raza;
        mascota.FechaNacimiento = dto.FechaNacimiento;
        mascota.Peso = dto.Peso;
        mascota.Color = dto.Color;
        mascota.FotoUrl = dto.FotoUrl;
        mascota.UsuarioId = dto.UsuarioId;
        mascota.Sexo = dto.Sexo;
        mascota.ObservacionesGenerales = dto.ObservacionesGenerales;
        mascota.AlergiasConocidas = dto.AlergiasConocidas;

        _unitOfWork.Mascotas.Update(mascota);
        await _unitOfWork.CommitAsync();

        if (oldUsuarioId != mascota.UsuarioId)
        {
            await _auditoriaService.RegistrarAccionAsync(
                "Cambio de Propietario",
                "Mascota",
                mascota.Id.ToString(),
                $"Se cambió el propietario de la mascota '{mascota.Nombre}' del UsuarioId {oldUsuarioId} al UsuarioId {mascota.UsuarioId}."
            );
        }

        return Response<Mascota>.Ok(mascota, "Mascota actualizada exitosamente.");
    }

    public async Task<Response<bool>> DeleteMascotaAsync(int id)
    {
        var mascota = await _unitOfWork.Mascotas.GetByIdAsync(id);
        if (mascota != null)
        {
            mascota.Activo = false;
            _unitOfWork.Mascotas.Update(mascota);

            // RF-13: Cancelar citas futuras
            var citasFuturas = await _unitOfWork.Citas.GetAll()
                .Where(c => c.MascotaId == id
                    && (c.Estado == "Pendiente" || c.Estado == "Confirmada")
                    && c.FechaHora > DateTime.Now)
                .ToListAsync();
                
            foreach (var cita in citasFuturas)
            {
                cita.Estado = "Cancelada";
                _unitOfWork.Citas.Update(cita);
            }

            await _unitOfWork.CommitAsync();

            await _auditoriaService.RegistrarAccionAsync(
                "Desactivar",
                "Mascota",
                mascota.Id.ToString(),
                $"Se inactivó la mascota '{mascota.Nombre}' y se cancelaron sus citas futuras."
            );

            return Response<bool>.Ok(true, "Mascota eliminada exitosamente.");
        }
        
        return Response<bool>.Fail("Mascota no encontrada.");
    }

    public async Task<IEnumerable<Usuario>> GetActiveUsuariosAsync()
    {
        return await _unitOfWork.Usuarios.GetAll()
            .Where(u => u.Activo)
            .OrderBy(u => u.Nombre)
            .ToListAsync();
    }
}
