using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Veterinaria.Domain.Contracts;
using Veterinaria.Domain.Entities;
using X.PagedList.Extensions;

namespace Veterinaria.Web.Controllers;

[Authorize(Roles = "Admin")]
public class ClientesController : Controller
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly UserManager<ApplicationUser> _userManager;

    public ClientesController(IUnitOfWork unitOfWork, UserManager<ApplicationUser> userManager)
    {
        _unitOfWork = unitOfWork;
        _userManager = userManager;
    }

    // GET: Clientes
    public async Task<IActionResult> Index(string buscar, bool? mostrarInactivos, int page = 1)
    {
        ViewBag.BuscarActual = buscar;
        ViewBag.MostrarInactivos = mostrarInactivos ?? false;

        var query = _unitOfWork.Usuarios.GetAll()
            .Include(u => u.Mascotas)
            .AsQueryable();

        // Filtrar por activos/inactivos
        if (mostrarInactivos != true)
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

        // Ordenar por fecha de registro (más recientes primero)
        query = query.OrderByDescending(u => u.FechaRegistro);

        var usuarios = await query.ToListAsync();
        
        // Obtener estadísticas de citas para cada usuario
        var usuarioIds = usuarios.Select(u => u.Id).ToList();
        var citasPorUsuario = await _unitOfWork.Citas.GetAll()
            .Include(c => c.Mascota)
            .Where(c => usuarioIds.Contains(c.Mascota.UsuarioId))
            .GroupBy(c => c.Mascota.UsuarioId)
            .Select(g => new { UsuarioId = g.Key, TotalCitas = g.Count() })
            .ToListAsync();

        ViewBag.CitasPorUsuario = citasPorUsuario.ToDictionary(x => x.UsuarioId, x => x.TotalCitas);

        var pagedList = usuarios.ToPagedList(page, 10);
        return View(pagedList);
    }

    // GET: Clientes/Details/5
    public async Task<IActionResult> Details(int id)
    {
        var usuario = await _unitOfWork.Usuarios.GetAll()
            .Include(u => u.Mascotas)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (usuario == null)
        {
            return NotFound();
        }

        // Obtener citas del usuario (a través de sus mascotas)
        var mascotaIds = usuario.Mascotas.Select(m => m.Id).ToList();
        var citas = await _unitOfWork.Citas.GetAll()
            .Include(c => c.Mascota)
            .Include(c => c.Servicio)
            .Include(c => c.Veterinario)
            .Where(c => mascotaIds.Contains(c.MascotaId))
            .OrderByDescending(c => c.FechaHora)
            .Take(20)
            .ToListAsync();

        // Estadísticas del cliente
        var todasLasCitas = await _unitOfWork.Citas.GetAll()
            .Where(c => mascotaIds.Contains(c.MascotaId))
            .ToListAsync();

        ViewBag.TotalCitas = todasLasCitas.Count;
        ViewBag.CitasCompletadas = todasLasCitas.Count(c => c.Estado == "Completada");
        ViewBag.CitasCanceladas = todasLasCitas.Count(c => c.Estado == "Cancelada");
        ViewBag.CitasPendientes = todasLasCitas.Count(c => c.Estado == "Pendiente" || c.Estado == "Confirmada");
        ViewBag.Citas = citas;

        // Pagos del cliente
        var pagos = await _unitOfWork.Pagos.GetAll()
            .Include(p => p.Cita)
            .Where(p => mascotaIds.Contains(p.Cita.MascotaId))
            .ToListAsync();

        ViewBag.TotalGastado = pagos.Sum(p => p.Monto);
        
        // Pagos pendientes = citas con EstadoPago = "Parcial" y Estado = "Completada"
        var citasConPagoPendiente = todasLasCitas
            .Where(c => c.EstadoPago == "Parcial" && c.Estado == "Completada")
            .Sum(c => c.MontoTotal - c.MontoPagado);
        ViewBag.PagosPendientes = citasConPagoPendiente;

        return View(usuario);
    }

    // POST: Clientes/ToggleActivo/5
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> ToggleActivo(int id)
    {
        var usuario = await _unitOfWork.Usuarios.GetByIdAsync(id);
        if (usuario == null)
        {
            return NotFound();
        }

        usuario.Activo = !usuario.Activo;
        _unitOfWork.Usuarios.Update(usuario);
        await _unitOfWork.CommitAsync();

        TempData["Success"] = usuario.Activo 
            ? $"Cliente {usuario.Nombre} activado exitosamente."
            : $"Cliente {usuario.Nombre} desactivado exitosamente.";

        return RedirectToAction(nameof(Index));
    }

    // POST: Clientes/Delete/5
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Delete(int id)
    {
        var usuario = await _unitOfWork.Usuarios.GetAll()
            .Include(u => u.Mascotas)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (usuario == null)
        {
            TempData["Error"] = "Cliente no encontrado.";
            return RedirectToAction(nameof(Index));
        }

        var nombreCliente = usuario.Nombre;

        try
        {
            // 1. Obtener IDs de las mascotas del usuario
            var mascotaIds = usuario.Mascotas.Select(m => m.Id).ToList();

            // 2. Obtener todas las citas de las mascotas
            var citas = await _unitOfWork.Citas.GetAll()
                .Where(c => mascotaIds.Contains(c.MascotaId))
                .ToListAsync();
            var citaIds = citas.Select(c => c.Id).ToList();

            // 3. Eliminar todos los pagos asociados a las citas
            var pagos = await _unitOfWork.Pagos.GetAll()
                .Where(p => citaIds.Contains(p.CitaId))
                .ToListAsync();
            foreach (var pago in pagos)
            {
                _unitOfWork.Pagos.Remove(pago);
            }

            // 4. Eliminar historiales clínicos de las citas (antes de eliminar las citas)
            var historiales = await _unitOfWork.HistorialesClinicos.GetAll()
                .Where(h => citaIds.Contains(h.CitaId))
                .ToListAsync();
            foreach (var historial in historiales)
            {
                _unitOfWork.HistorialesClinicos.Remove(historial);
            }

            // 5. Eliminar todas las citas
            foreach (var cita in citas)
            {
                _unitOfWork.Citas.Remove(cita);
            }

            // 6. Eliminar notificaciones del usuario
            var notificaciones = await _unitOfWork.Notificaciones.GetAll()
                .Where(n => n.UsuarioId == usuario.Id)
                .ToListAsync();
            foreach (var notificacion in notificaciones)
            {
                _unitOfWork.Notificaciones.Remove(notificacion);
            }

            // 7. Eliminar tarjetas guardadas del usuario
            var tarjetas = await _unitOfWork.TarjetasGuardadas.GetAll()
                .Where(t => t.UsuarioId == usuario.Id)
                .ToListAsync();
            foreach (var tarjeta in tarjetas)
            {
                _unitOfWork.TarjetasGuardadas.Remove(tarjeta);
            }

            // 8. Eliminar todas las mascotas
            foreach (var mascota in usuario.Mascotas)
            {
                _unitOfWork.Mascotas.Remove(mascota);
            }

            // 9. Eliminar el usuario de la tabla Usuarios
            _unitOfWork.Usuarios.Remove(usuario);

            // 10. Guardar cambios en la base de datos
            await _unitOfWork.CommitAsync();

            // 11. Eliminar la cuenta de Identity si existe
            if (!string.IsNullOrEmpty(usuario.ApplicationUserId))
            {
                var appUser = await _userManager.FindByIdAsync(usuario.ApplicationUserId);
                if (appUser != null)
                {
                    await _userManager.DeleteAsync(appUser);
                }
            }

            TempData["Success"] = $"Cliente '{nombreCliente}' y todos sus datos asociados han sido eliminados permanentemente.";
        }
        catch (Exception ex)
        {
            TempData["Error"] = $"Error al eliminar el cliente: {ex.Message}";
        }

        return RedirectToAction(nameof(Index));
    }
}
