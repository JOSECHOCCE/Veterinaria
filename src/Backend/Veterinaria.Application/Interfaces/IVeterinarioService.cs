using System.Collections.Generic;
using System.Threading.Tasks;
using Veterinaria.Domain.Entities;

namespace Veterinaria.Application.Interfaces;

public interface IVeterinarioService
{
    IEnumerable<Veterinario> GetVeterinarios(string? especialidad, string? q);
    IEnumerable<string> GetEspecialidades();
    Task<Veterinario?> GetVeterinarioWithCitasAsync(int id);
    Task<Veterinario?> GetVeterinarioByIdAsync(int id);
    Task AddVeterinarioAsync(Veterinario veterinario);
    Task UpdateVeterinarioAsync(Veterinario veterinario);
    Task<bool> DeleteVeterinarioAsync(int id);
}
