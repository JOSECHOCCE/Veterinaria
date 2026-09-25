using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Veterinaria.Application.Interfaces;
using Veterinaria.Domain.Contracts;
using Veterinaria.Domain.Entities;

namespace Veterinaria.Application.Services;

public class VentaService : IVentaService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly INotificacionService _notificacionService;

    public VentaService(IUnitOfWork unitOfWork, INotificacionService notificacionService)
    {
        _unitOfWork = unitOfWork;
        _notificacionService = notificacionService;
    }

    public IQueryable<Venta> GetVentasQuery()
    {
        return _unitOfWork.Ventas.GetAll()
            .Include(v => v.Cliente)
            .Include(v => v.Detalles)
                .ThenInclude(d => d.Producto)
            .AsQueryable();
    }

    public async Task<Venta?> GetVentaByIdAsync(int id)
    {
        return await _unitOfWork.Ventas.GetAll()
            .Include(v => v.Cliente)
            .Include(v => v.Detalles)
                .ThenInclude(d => d.Producto)
            .FirstOrDefaultAsync(v => v.Id == id);
    }

    public async Task<Venta> RegistrarVentaAsync(Venta venta, string registradoPor = "Caja Mostrador")
    {
        if (venta == null || !venta.Detalles.Any())
        {
            throw new ArgumentException("La venta debe contener al menos un detalle de producto.");
        }

        // T6 SHOULD: venta + kardex en una sola transacción (antes: 2 CommitAsync sueltos).
        await _unitOfWork.BeginTransactionAsync();
        try
        {
            decimal totalVenta = 0;
            var pendientesKardex = new List<(int ProductoId, int Cantidad)>();

            foreach (var detalle in venta.Detalles)
            {
                var producto = await _unitOfWork.Productos.GetByIdAsync(detalle.ProductoId);
                if (producto == null || !producto.Activo)
                {
                    throw new InvalidOperationException($"El producto con ID {detalle.ProductoId} no existe o no está activo.");
                }

                if (producto.Stock < detalle.Cantidad)
                {
                    throw new InvalidOperationException($"Stock insuficiente para el producto '{producto.Nombre}'. Stock disponible: {producto.Stock}, solicitado: {detalle.Cantidad}.");
                }

                // Validar restricción de Receta Médica (HU-014 / RF-017)
                if (producto.RequiereReceta)
                {
                    if (!venta.RecetaId.HasValue || venta.RecetaId.Value <= 0)
                    {
                        throw new InvalidOperationException($"El producto '{producto.Nombre}' requiere una receta médica válida para su venta.");
                    }

                    var receta = await _unitOfWork.Recetas.GetAll()
                        .Include(r => r.Items)
                        .FirstOrDefaultAsync(r => r.Id == venta.RecetaId.Value);

                    if (receta == null || !receta.Items.Any(i => i.ProductoId == producto.Id))
                    {
                        throw new InvalidOperationException($"La receta #{venta.RecetaId} no autoriza la venta del medicamento '{producto.Nombre}'.");
                    }
                }

                // Deducir stock
                producto.Stock -= detalle.Cantidad;
                _unitOfWork.Productos.Update(producto);
                pendientesKardex.Add((producto.Id, detalle.Cantidad));

                // Calcular valores del detalle
                detalle.PrecioUnitario = producto.Precio;
                detalle.Subtotal = producto.Precio * detalle.Cantidad;
                totalVenta += detalle.Subtotal;

                // Verificar si el stock cae por debajo del mínimo para notificar al Admin
                if (producto.Stock <= producto.StockMinimo)
                {
                    await GenerarNotificacionesBajoStockAsync(producto);
                }
            }

            venta.Total = totalVenta;
            venta.Fecha = DateTime.UtcNow;
            venta.Estado = "Completada";

            // Guardar venta primero para obtener Id final antes de crear Kardex (H4).
            await _unitOfWork.Ventas.AddAsync(venta);
            await _unitOfWork.CommitAsync();

            // Registrar movimientos de inventario en Kardex (RNF-020) con Id final.
            foreach (var (productoId, cantidad) in pendientesKardex)
            {
                var movimiento = new MovimientoInventario
                {
                    ProductoId = productoId,
                    TipoMovimiento = "SalidaVenta",
                    Cantidad = cantidad,
                    Motivo = $"Venta en mostrador #{venta.Id}",
                    RegistradoPor = registradoPor,
                    FechaRegistro = DateTime.UtcNow
                };
                await _unitOfWork.MovimientosInventario.AddAsync(movimiento);
            }
            await _unitOfWork.CommitAsync();
            await _unitOfWork.CommitTransactionAsync();

            return venta;
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync();
            throw;
        }
    }

    public async Task<bool> CancelarVentaAsync(int id, string registradoPor = "Caja Mostrador")
    {
        var venta = await GetVentaByIdAsync(id);
        if (venta == null || venta.Estado == "Cancelada")
            return false;

        venta.Estado = "Cancelada";

        // Devolver el stock a los productos + Kardex inverso (H4 / RF-026)
        foreach (var detalle in venta.Detalles)
        {
            var producto = await _unitOfWork.Productos.GetByIdAsync(detalle.ProductoId);
            if (producto != null)
            {
                producto.Stock += detalle.Cantidad;
                _unitOfWork.Productos.Update(producto);

                await _unitOfWork.MovimientosInventario.AddAsync(new MovimientoInventario
                {
                    ProductoId = producto.Id,
                    TipoMovimiento = "EntradaDevolucion",
                    Cantidad = detalle.Cantidad,
                    Motivo = $"Devolución por cancelación venta #{venta.Id}",
                    RegistradoPor = registradoPor,
                    FechaRegistro = DateTime.UtcNow
                });
            }
            detalle.Producto = null!;
        }

        _unitOfWork.Ventas.Update(venta);
        await _unitOfWork.CommitAsync();
        return true;
    }

    private async Task GenerarNotificacionesBajoStockAsync(Producto producto)
    {
        try
        {
            // Obtener todos los usuarios con rol Admin
            var admins = await _unitOfWork.Usuarios.GetAll()
                .Where(u => u.Activo && u.Rol == "Admin")
                .ToListAsync();

            foreach (var admin in admins)
            {
                await _notificacionService.CrearNotificacionAsync(
                    admin.Id,
                    "Alerta de Stock Mínimo",
                    $"El producto '{producto.Nombre}' ha alcanzado un stock bajo ({producto.Stock} unidades). Stock mínimo configurado: {producto.StockMinimo}.",
                    "Warning",
                    "inventory",
                    "/admin/inventario"
                );
            }
        }
        catch (Exception ex)
        {
            // Evitar que un error en notificaciones aborte el registro de la venta
            Console.WriteLine($"Error al generar notificaciones de bajo stock: {ex.Message}");
        }
    }
}
