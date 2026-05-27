using System.Threading.Tasks;

namespace Veterinaria.Application.Interfaces;

public interface IAuditoriaService
{
    Task RegistrarAccionAsync(string accion, string entidad, string entidadId, string detalle);
}
