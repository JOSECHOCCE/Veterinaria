using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
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
}
