using System.Collections.Generic;
using System.Threading.Tasks;
using Veterinaria.Domain.Entities;

namespace Veterinaria.Application.Interfaces;

public interface IRecetaService
{
    Task<Receta?> GetRecetaByIdAsync(int id);
    Task<Receta?> GetRecetaByHistorialIdAsync(int historialId);
    Task<Receta> CrearRecetaAsync(Receta receta);
    Task<Dictionary<int, int>> ObtenerStockDisponibleProductosAsync(List<int> productoIds);
}
