using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using Veterinaria.Domain.Contracts;
using Veterinaria.Domain.Entities;
using Veterinaria.Application.Interfaces;
using Microsoft.AspNetCore.Identity;

namespace Veterinaria.Application.Services;

public class ClienteService : IClienteService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly UserManager<ApplicationUser> _userManager;

    public ClienteService(IUnitOfWork unitOfWork, UserManager<ApplicationUser> userManager)
    {
        _unitOfWork = unitOfWork;
        _userManager = userManager;
    }

    public async Task<(IEnumerable<Usuario> Usuarios, Dictionary<int, int> CitasPorUsuario)> GetClientesAsync(string buscar, bool mostrarInactivos)
    {
        var query = _unitOfWork.Usuarios.GetAll()
            .Include(u => u.Mascotas)
            .AsQueryable();

        // Filtrar por activos/inactivos
        if (!mostrarInactivos)
        {
            query = query.Where(u => u.Activo);
        }

        // Búsqueda
        if (!string.IsNullOrEmpty(buscar))
        {
            buscar = buscar.ToLower();
            query = query.Where(u => 
                u.Nombre.ToLower().Contains(buscar) ||
                u.Email.ToLower().Contains(buscar) ||
                (u.Telefono != null && u.Telefono.Contains(buscar)));
        }

        // Ordenar por fecha de registro
        query = query.OrderByDescending(u => u.FechaRegistro);

        var usuarios = await query.ToListAsync();
        
        // Obtener estadísticas
        var usuarioIds = usuarios.Select(u => u.Id).ToList();
        var citasPorUsuario = await _unitOfWork.Citas.GetAll()
            .Include(c => c.Mascota)
            .Where(c => usuarioIds.Contains(c.Mascota.UsuarioId))
            .GroupBy(c => c.Mascota.UsuarioId)
            .Select(g => new { UsuarioId = g.Key, TotalCitas = g.Count() })
            .ToListAsync();

        return (usuarios, citasPorUsuario.ToDictionary(x => x.UsuarioId, x => x.TotalCitas));
    }

    public async Task<ClienteDetalleDto?> GetClienteDetailsAsync(int id)
    {
        var usuario = await _unitOfWork.Usuarios.GetAll()
            .Include(u => u.Mascotas)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (usuario == null) return null;

        var mascotaIds = usuario.Mascotas.Select(m => m.Id).ToList();
        var citas = await _unitOfWork.Citas.GetAll()
            .Include(c => c.Mascota)
            .Include(c => c.Servicio)
            .Include(c => c.Veterinario)
            .Where(c => mascotaIds.Contains(c.MascotaId))
            .OrderByDescending(c => c.FechaHora)
            .Take(20)
            .ToListAsync();

        var todasLasCitas = await _unitOfWork.Citas.GetAll()
            .Where(c => mascotaIds.Contains(c.MascotaId))
            .ToListAsync();

        var pagos = await _unitOfWork.Pagos.GetAll()
            .Include(p => p.Cita)
            .Where(p => mascotaIds.Contains(p.Cita.MascotaId))
            .ToListAsync();

        var citasConPagoPendiente = todasLasCitas
            .Where(c => c.EstadoPago == "Parcial" && c.Estado == "Completada")
            .Sum(c => c.MontoTotal - c.MontoPagado);

        return new ClienteDetalleDto
        {
            Usuario = usuario,
            UltimasCitas = citas,
            TotalCitas = todasLasCitas.Count,
            CitasCompletadas = todasLasCitas.Count(c => c.Estado == "Completada"),
            CitasCanceladas = todasLasCitas.Count(c => c.Estado == "Cancelada"),
            CitasPendientes = todasLasCitas.Count(c => c.Estado == "Pendiente" || c.Estado == "Confirmada"),
            TotalGastado = pagos.Sum(p => p.Monto),
            PagosPendientes = citasConPagoPendiente
        };
    }

    public async Task<bool> ToggleActivoAsync(int id)
    {
        var usuario = await _unitOfWork.Usuarios.GetByIdAsync(id);
        if (usuario == null) return false;

        usuario.Activo = !usuario.Activo;
        _unitOfWork.Usuarios.Update(usuario);
        await _unitOfWork.CommitAsync();
        return true;
    }

    public async Task<(bool Success, string Message)> DeleteCascadeAsync(int id)
    {
        var usuario = await _unitOfWork.Usuarios.GetAll()
            .Include(u => u.Mascotas)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (usuario == null) return (false, "Cliente no encontrado.");

        try
        {
            // Soft-delete en cascada: desactivar usuario y sus mascotas
            // en vez de eliminar físicamente, para preservar datos históricos
            usuario.Activo = false;
            _unitOfWork.Usuarios.Update(usuario);

            foreach (var mascota in usuario.Mascotas)
            {
                mascota.Activo = false;
                _unitOfWork.Mascotas.Update(mascota);
            }

            // Cancelar citas pendientes/confirmadas del cliente
            var mascotaIds = usuario.Mascotas.Select(m => m.Id).ToList();
            var citasPendientes = await _unitOfWork.Citas.GetAll()
                .Where(c => mascotaIds.Contains(c.MascotaId) &&
                       (c.Estado == "Pendiente" || c.Estado == "Confirmada"))
                .ToListAsync();

            foreach (var cita in citasPendientes)
            {
                cita.Estado = "Cancelada";
                _unitOfWork.Citas.Update(cita);
            }

            await _unitOfWork.CommitAsync();

            // Desactivar cuenta de Identity (lockout) sin eliminarla
            if (!string.IsNullOrEmpty(usuario.ApplicationUserId))
            {
                var appUser = await _userManager.FindByIdAsync(usuario.ApplicationUserId);
                if (appUser != null)
                {
                    await _userManager.SetLockoutEnabledAsync(appUser, true);
                    await _userManager.SetLockoutEndDateAsync(appUser, DateTimeOffset.MaxValue);
                }
            }

            return (true, $"Cliente '{usuario.Nombre}' y sus mascotas han sido desactivados.");
        }
        catch (Exception ex)
        {
            return (false, $"Error al desactivar el cliente: {ex.Message}");
        }
    }
}
