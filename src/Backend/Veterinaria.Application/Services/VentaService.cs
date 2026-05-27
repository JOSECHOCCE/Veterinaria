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

    public async Task<Venta> RegistrarVentaAsync(Venta venta)
    {
        if (venta == null || !venta.Detalles.Any())
        {
            throw new ArgumentException("La venta debe contener al menos un detalle de producto.");
        }

        decimal totalVenta = 0;

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

            // Deducir stock
            producto.Stock -= detalle.Cantidad;
            _unitOfWork.Productos.Update(producto);

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

        await _unitOfWork.Ventas.AddAsync(venta);
        await _unitOfWork.CommitAsync();

        return venta;
    }

    public async Task<bool> CancelarVentaAsync(int id)
    {
        var venta = await GetVentaByIdAsync(id);
        if (venta == null || venta.Estado == "Cancelada")
            return false;

        venta.Estado = "Cancelada";

        // Devolver el stock a los productos
        foreach (var detalle in venta.Detalles)
        {
            var producto = await _unitOfWork.Productos.GetByIdAsync(detalle.ProductoId);
            if (producto != null)
            {
                producto.Stock += detalle.Cantidad;
                _unitOfWork.Productos.Update(producto);
            }
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
