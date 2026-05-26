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
            var mascotaIds = usuario.Mascotas.Select(m => m.Id).ToList();

            var citas = await _unitOfWork.Citas.GetAll()
                .Where(c => mascotaIds.Contains(c.MascotaId))
                .ToListAsync();
            var citaIds = citas.Select(c => c.Id).ToList();

            var pagos = await _unitOfWork.Pagos.GetAll()
                .Where(p => citaIds.Contains(p.CitaId))
                .ToListAsync();
            foreach (var pago in pagos) _unitOfWork.Pagos.Remove(pago);

            var historiales = await _unitOfWork.HistorialesClinicos.GetAll()
                .Where(h => citaIds.Contains(h.CitaId))
                .ToListAsync();
            foreach (var historial in historiales) _unitOfWork.HistorialesClinicos.Remove(historial);

            foreach (var cita in citas) _unitOfWork.Citas.Remove(cita);

            var notificaciones = await _unitOfWork.Notificaciones.GetAll()
                .Where(n => n.UsuarioId == usuario.Id)
                .ToListAsync();
            foreach (var notificacion in notificaciones) _unitOfWork.Notificaciones.Remove(notificacion);

            var tarjetas = await _unitOfWork.TarjetasGuardadas.GetAll()
                .Where(t => t.UsuarioId == usuario.Id)
                .ToListAsync();
            foreach (var tarjeta in tarjetas) _unitOfWork.TarjetasGuardadas.Remove(tarjeta);

            foreach (var mascota in usuario.Mascotas) _unitOfWork.Mascotas.Remove(mascota);

            _unitOfWork.Usuarios.Remove(usuario);
            await _unitOfWork.CommitAsync();

            if (!string.IsNullOrEmpty(usuario.ApplicationUserId))
            {
                var appUser = await _userManager.FindByIdAsync(usuario.ApplicationUserId);
                if (appUser != null)
                {
                    await _userManager.DeleteAsync(appUser);
                }
            }

            return (true, $"Cliente '{usuario.Nombre}' y todos sus datos asociados han sido eliminados.");
        }
        catch (Exception ex)
        {
            return (false, $"Error al eliminar el cliente: {ex.Message}");
        }
    }
}
