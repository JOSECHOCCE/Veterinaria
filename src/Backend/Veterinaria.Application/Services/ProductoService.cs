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

public class ProductoService : IProductoService
{
    private readonly IUnitOfWork _unitOfWork;

    public ProductoService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public IQueryable<Producto> GetActiveProductosQuery()
    {
        return _unitOfWork.Productos.GetAll()
            .Where(p => p.Activo)
            .AsQueryable();
    }

    public async Task<Producto?> GetProductoByIdAsync(int id)
    {
        return await _unitOfWork.Productos.GetByIdAsync(id);
    }

    public async Task AddProductoAsync(Producto producto)
    {
        await _unitOfWork.Productos.AddAsync(producto);
        await _unitOfWork.CommitAsync();
    }

    public async Task UpdateProductoAsync(Producto producto)
    {
        _unitOfWork.Productos.Update(producto);
        await _unitOfWork.CommitAsync();
    }

    public async Task DeleteProductoAsync(int id)
    {
        var producto = await _unitOfWork.Productos.GetByIdAsync(id);
        if (producto != null)
        {
            producto.Activo = false; // Soft-delete
            _unitOfWork.Productos.Update(producto);
            await _unitOfWork.CommitAsync();
        }
    }

    public async Task<IEnumerable<Producto>> GetProductosBajoStockAsync()
    {
        return await _unitOfWork.Productos.GetAll()
            .Where(p => p.Activo && p.Stock <= p.StockMinimo)
            .ToListAsync();
    }

    public async Task<int> CalcularRopDinamicoAsync(int productoId)
    {
        var producto = await _unitOfWork.Productos.GetByIdAsync(productoId);
        if (producto == null) return 0;

        var fechaLimite = DateTime.UtcNow.AddDays(-30);

        // Sumar consumo de ventas en últimos 30 días
        var consumoVentas = await _unitOfWork.DetallesVentas.GetAll()
            .Where(d => d.ProductoId == productoId && d.Venta.Fecha >= fechaLimite)
            .SumAsync(d => (int?)d.Cantidad) ?? 0;

        // Sumar consumo de recetas en últimos 30 días
        var consumoRecetas = await _unitOfWork.DetalleRecetas.GetAll()
            .Where(d => d.ProductoId == productoId && d.Receta.FechaEmision >= fechaLimite)
            .SumAsync(d => (int?)d.CantidadPrescrita) ?? 0;

        var totalConsumo = consumoVentas + consumoRecetas;

        // Fallback a StockMinimo para productos sin historial de ventas de 30 días
        if (totalConsumo == 0)
        {
            return producto.StockMinimo;
        }

        decimal consumoDiario = (decimal)totalConsumo / 30m;
        int rop = (int)Math.Ceiling(consumoDiario * producto.LeadTimeDias + producto.StockSeguridad);

        return Math.Max(rop, producto.StockMinimo);
    }

    public async Task<Response<bool>> RegistrarMermaAsync(RegistrarMermaDto dto, string usuario)
    {
        var producto = await _unitOfWork.Productos.GetByIdAsync(dto.ProductoId);
        if (producto == null)
        {
            return Response<bool>.Fail("Producto no encontrado");
        }

        if (producto.Stock < dto.Cantidad)
        {
            return Response<bool>.Fail("Stock insuficiente para registrar la merma");
        }

        producto.Stock -= dto.Cantidad;
        _unitOfWork.Productos.Update(producto);

        var movimiento = new MovimientoInventario
        {
            ProductoId = dto.ProductoId,
            TipoMovimiento = dto.Motivo,
            Cantidad = dto.Cantidad,
            Motivo = dto.Observaciones,
            RegistradoPor = usuario,
            FechaRegistro = DateTime.UtcNow
        };

        await _unitOfWork.MovimientosInventario.AddAsync(movimiento);
        await _unitOfWork.CommitAsync();

        return Response<bool>.Ok(true, "Merma registrada correctamente");
    }

    public async Task<IEnumerable<ProductoAlertaDto>> GetAlertasInventarioAsync()
    {
        var productos = await _unitOfWork.Productos.GetAll()
            .Where(p => p.Activo)
            .ToListAsync();

        var alertas = new List<ProductoAlertaDto>();
        var limiteVencimiento = DateTime.UtcNow.AddDays(30);

        foreach (var p in productos)
        {
            int rop = await CalcularRopDinamicoAsync(p.Id);
            bool stockBajo = p.Stock <= rop;
            bool porVencer = p.FechaVencimiento.HasValue && p.FechaVencimiento.Value <= limiteVencimiento;

            if (stockBajo || porVencer)
            {
                string tipoAlerta = (stockBajo && porVencer) ? "Ambos" : stockBajo ? "StockBajo" : "PorVencer";

                alertas.Add(new ProductoAlertaDto
                {
                    Id = p.Id,
                    Nombre = p.Nombre,
                    Categoria = p.Categoria,
                    Stock = p.Stock,
                    StockMinimo = p.StockMinimo,
                    RopCalculado = rop,
                    FechaVencimiento = p.FechaVencimiento,
                    TipoAlerta = tipoAlerta
                });
            }
        }

        return alertas;
    }
}
