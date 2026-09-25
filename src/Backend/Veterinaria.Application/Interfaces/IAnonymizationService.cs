using System.Threading.Tasks;
using Veterinaria.Domain.Entities;

namespace Veterinaria.Application.Interfaces;

public interface IAnonymizationService
{
    Task<Usuario> AnonimizarClienteAsync(int clienteUsuarioId, int ejecutadoPorUsuarioId, string? ipAddress);
}
