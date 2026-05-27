using System.Linq;
using System.Threading.Tasks;
using Veterinaria.Domain.Entities;

namespace Veterinaria.Application.Interfaces;

public interface IVentaService
{
    IQueryable<Venta> GetVentasQuery();
    Task<Venta?> GetVentaByIdAsync(int id);
    Task<Venta> RegistrarVentaAsync(Venta venta);
    Task<bool> CancelarVentaAsync(int id);
}
