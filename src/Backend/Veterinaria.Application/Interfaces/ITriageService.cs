using System.Collections.Generic;
using System.Threading.Tasks;
using Veterinaria.Domain.Entities;

namespace Veterinaria.Application.Interfaces;

public interface ITriageService
{
    Task<List<Triage>> GetColaTriageAsync();
    Task AddTriageAsync(Triage triage);
    Task<Triage?> GetTriageByIdAsync(int id);
    Task UpdateTriageAsync(Triage triage);
    Task<List<Mascota>> GetMascotasActivasConUsuarioAsync();
}
