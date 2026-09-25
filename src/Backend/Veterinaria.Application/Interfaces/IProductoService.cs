using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Veterinaria.Application.DTOs;
using Veterinaria.Domain.Entities;

namespace Veterinaria.Application.Interfaces;

public interface IProductoService
{
    IQueryable<Producto> GetActiveProductosQuery();
    Task<Producto?> GetProductoByIdAsync(int id);
    Task AddProductoAsync(Producto producto);
    Task UpdateProductoAsync(Producto producto);
    Task DeleteProductoAsync(int id);
    Task<IEnumerable<Producto>> GetProductosBajoStockAsync();
    Task<int> CalcularRopDinamicoAsync(int productoId);
    Task<Response<bool>> RegistrarMermaAsync(RegistrarMermaDto dto, string usuario);
    Task<IEnumerable<ProductoAlertaDto>> GetAlertasInventarioAsync();
}
