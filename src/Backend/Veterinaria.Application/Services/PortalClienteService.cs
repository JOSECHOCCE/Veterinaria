using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Veterinaria.Application.DTOs;
using Veterinaria.Application.Interfaces;
using Veterinaria.Domain.Contracts;
using Veterinaria.Domain.Entities;

namespace Veterinaria.Application.Services;

public class PortalClienteService : IPortalClienteService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ICitaService _citaService;

    public PortalClienteService(
        IUnitOfWork unitOfWork,
        UserManager<ApplicationUser> userManager,
        ICitaService citaService)
    {
        _unitOfWork = unitOfWork;
        _userManager = userManager;
        _citaService = citaService;
    }

    public async Task<Response<PortalDashboardDto>> GetDashboardAsync(int usuarioId)
    {
        var ahora = DateTime.Now;

        // Próximas citas (desde hoy en adelante)
        var citas = await _unitOfWork.Citas.GetAll()
            .Include(c => c.Mascota)
            .Include(c => c.Servicio)
            .Include(c => c.Veterinario)
            .Where(c => c.Mascota.UsuarioId == usuarioId 
                        && c.FechaHora >= ahora.Date
                        && c.Estado != "Cancelada" 
                        && c.Estado != "Rechazada")
            .OrderBy(c => c.FechaHora)
            .Take(5)
            .Select(c => new
            {
                c.Id,
                c.FechaHora,
                MascotaNombre = c.Mascota.Nombre,
                ServicioNombre = c.Servicio.Nombre,
                VeterinarioNombre = c.Veterinario != null ? c.Veterinario.Nombre : "Por asignar",
                c.Estado
            })
            .ToListAsync();

        var mascotas = await _unitOfWork.Mascotas.GetAll()
            .Where(m => m.UsuarioId == usuarioId && m.Activo)
            .Select(m => new
            {
                m.Id,
                m.Nombre,
                m.Especie,
                m.Raza,
                m.FechaNacimiento
            })
            .ToListAsync();

        var notificaciones = await _unitOfWork.Notificaciones.GetAll()
            .Where(n => n.UsuarioId == usuarioId && !n.Leida)
            .OrderByDescending(n => n.FechaCreacion)
            .Take(5)
            .Select(n => new
            {
                n.Id,
                n.Titulo,
                n.Mensaje,
                n.Tipo,
                n.FechaCreacion
            })
            .ToListAsync();

        var dashboard = new PortalDashboardDto
        {
            ProximasCitas = citas,
            Mascotas = mascotas,
            Alertas = notificaciones
        };

        return Response<PortalDashboardDto>.Ok(dashboard);
    }

    public async Task<Response<IEnumerable<object>>> GetMisMascotasAsync(int usuarioId)
    {
        var mascotas = await _unitOfWork.Mascotas.GetAll()
            .Where(m => m.UsuarioId == usuarioId && m.Activo)
            .Select(m => new
            {
                m.Id,
                m.Nombre,
                m.Especie,
                m.Raza,
                m.FechaNacimiento,
                m.Sexo,
                m.Color,
                m.AlergiasConocidas
            })
            .ToListAsync();

        return Response<IEnumerable<object>>.Ok(mascotas);
    }

    public async Task<Response<object>> RegistrarMascotaAsync(int usuarioId, RegistrarMascotaPortalDto dto)
    {
        var mascota = new Mascota
        {
            Nombre = dto.Nombre,
            Especie = dto.Especie,
            UsuarioId = usuarioId,
            Activo = true
        };

        await _unitOfWork.Mascotas.AddAsync(mascota);
        await _unitOfWork.CommitAsync();

        return Response<object>.Ok(new { mascota.Id, mascota.Nombre }, "Mascota registrada exitosamente.");
    }

    public async Task<Response<IEnumerable<object>>> GetMisCitasAsync(int usuarioId)
    {
        var citas = await _unitOfWork.Citas.GetAll()
            .Include(c => c.Mascota)
            .Include(c => c.Servicio)
            .Include(c => c.Veterinario)
            .Where(c => c.Mascota.UsuarioId == usuarioId)
            .OrderByDescending(c => c.FechaHora)
            .Select(c => new
            {
                c.Id,
                c.FechaHora,
                MascotaNombre = c.Mascota.Nombre,
                ServicioNombre = c.Servicio.Nombre,
                VeterinarioNombre = c.Veterinario != null ? c.Veterinario.Nombre : "Por asignar",
                c.Estado,
                c.MontoTotal,
                c.MontoPagado
            })
            .ToListAsync();

        return Response<IEnumerable<object>>.Ok(citas);
    }

    public async Task<Response<object>> SolicitarCitaAsync(int usuarioId, SolicitarCitaPortalDto dto)
    {
        // Regla 5: No se puede agendar una cita en fecha pasada
        if (dto.FechaHora < DateTime.Now)
            return Response<object>.Fail("No se puede agendar una cita en una fecha pasada.");

        var mascota = await _unitOfWork.Mascotas.GetByIdAsync(dto.MascotaId);
        if (mascota == null || mascota.UsuarioId != usuarioId || !mascota.Activo)
            return Response<object>.Fail("Mascota no válida o inactiva.");

        var servicio = await _unitOfWork.Servicios.GetByIdAsync(dto.ServicioId);
        if (servicio == null || !servicio.Activo)
            return Response<object>.Fail("Servicio no válido o inactivo.");

        // RF-55 y RF-26: La cita queda en estado PendienteConfirmacion
        var cita = new Cita
        {
            MascotaId = dto.MascotaId,
            ServicioId = dto.ServicioId,
            FechaHora = dto.FechaHora,
            VeterinarioId = dto.VeterinarioId ?? 0,
            Motivo = dto.Motivo,
            Estado = "PendienteConfirmacion",
            EsUrgencia = false
        };

        if (dto.VeterinarioId == null)
        {
            cita.Estado = "PendienteAsignacion";
        }

        try
        {
            // Valida disponibilidad en _citaService.CreateCitaAsync
            var precioServicio = servicio.Precio;
            await _citaService.CreateCitaAsync(cita, precioServicio);
            return Response<object>.Ok(new { cita.Id }, "Solicitud de cita enviada. Pendiente de confirmación por la clínica.");
        }
        catch (InvalidOperationException ex)
        {
            return Response<object>.Fail(ex.Message);
        }
    }

    public async Task<Response<object>> CancelarCitaAsync(int usuarioId, int citaId)
    {
        // Utilizamos el CitaService que ya implementa la lógica de las 2 horas de anticipación
        var result = await _citaService.CancelarCitaAsync(citaId, false, usuarioId);
        
        if (result.Success)
            return Response<object>.Ok(new { citaId }, "La cita fue cancelada exitosamente.");
            
        return Response<object>.Fail(result.Error ?? "Error al cancelar la cita.");
    }

    public async Task<Response<IEnumerable<object>>> GetHistorialMascotaAsync(int usuarioId, int mascotaId)
    {
        var mascota = await _unitOfWork.Mascotas.GetByIdAsync(mascotaId);
        if (mascota == null || mascota.UsuarioId != usuarioId)
            return Response<IEnumerable<object>>.Fail("Mascota no encontrada o acceso denegado.");

        var historiales = await _unitOfWork.HistorialesClinicos.GetAll()
            .Include(h => h.Cita)
                .ThenInclude(c => c.Servicio)
            .Include(h => h.Cita.Veterinario)
            .Where(h => h.Cita.MascotaId == mascotaId)
            .OrderByDescending(h => h.FechaRegistro)
            .Select(h => new
            {
                h.Id,
                h.FechaRegistro,
                ServicioNombre = h.Cita.Servicio.Nombre,
                VeterinarioNombre = h.Cita.Veterinario.Nombre,
                h.MotivoConsulta,
                h.Hallazgos,
                h.Diagnostico,
                h.Tratamiento,
                h.Medicamentos,
                h.Recomendaciones,
                h.ProximoControl
            })
            .ToListAsync();

        return Response<IEnumerable<object>>.Ok(historiales);
    }

    public async Task<Response<IEnumerable<object>>> GetMisPagosAsync(int usuarioId)
    {
        var pagos = await _unitOfWork.Pagos.GetAll()
            .Include(p => p.Cita)
                .ThenInclude(c => c.Servicio)
            .Where(p => p.Cita.Mascota.UsuarioId == usuarioId)
            .OrderByDescending(p => p.FechaPago)
            .Select(p => new
            {
                p.Id,
                p.FechaPago,
                MontoCobrado = p.Monto,
                p.MetodoPago,
                NumeroOperacion = p.Referencia,
                Estado = p.Cita.EstadoPago,
                ServicioNombre = p.Cita.Servicio.Nombre,
                CitaFecha = p.Cita.FechaHora
            })
            .ToListAsync();

        return Response<IEnumerable<object>>.Ok(pagos);
    }

    public async Task<Response<object>> GetMiPerfilAsync(int usuarioId)
    {
        var usuario = await _unitOfWork.Usuarios.GetByIdAsync(usuarioId);
        if (usuario == null)
            return Response<object>.Fail("Usuario no encontrado.");

        var appUser = await _userManager.FindByIdAsync(usuario.ApplicationUserId);

        var perfil = new
        {
            usuario.Id,
            usuario.Nombre,
            DocumentoIdentidad = usuario.DNI,
            usuario.Telefono,
            usuario.Direccion,
            usuario.RecibirRecordatorios,
            Email = appUser?.Email
        };

        return Response<object>.Ok(perfil);
    }

    public async Task<Response<object>> ActualizarPerfilAsync(int usuarioId, ActualizarPerfilPortalDto dto)
    {
        var usuario = await _unitOfWork.Usuarios.GetByIdAsync(usuarioId);
        if (usuario == null)
            return Response<object>.Fail("Usuario no encontrado.");

        var appUser = await _userManager.FindByIdAsync(usuario.ApplicationUserId);
        if (appUser == null)
            return Response<object>.Fail("Cuenta de acceso no encontrada.");

        if (!string.IsNullOrEmpty(dto.Telefono))
            usuario.Telefono = dto.Telefono;
            
        if (dto.Direccion != null) // Puede actualizarse a vacío, o simplemente si se provee
            usuario.Direccion = dto.Direccion;

        _unitOfWork.Usuarios.Update(usuario);
        
        // Cambio de contraseña si se solicita
        if (!string.IsNullOrEmpty(dto.PasswordActual) && !string.IsNullOrEmpty(dto.PasswordNuevo))
        {
            var changePasswordResult = await _userManager.ChangePasswordAsync(appUser, dto.PasswordActual, dto.PasswordNuevo);
            if (!changePasswordResult.Succeeded)
            {
                var errors = string.Join(", ", changePasswordResult.Errors.Select(e => e.Description));
                return Response<object>.Fail($"Error al cambiar la contraseña: {errors}");
            }
        }

        await _unitOfWork.CommitAsync();

        return Response<object>.Ok(null, "Perfil actualizado exitosamente.");
    }
}
