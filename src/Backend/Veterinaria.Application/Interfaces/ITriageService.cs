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
    Task<Triage> RegistrarSignosVitalesAsync(int triageId, string nivel, string? sintomas, decimal? temperatura, int? fc, decimal? peso);
    Task<Triage> CambiarEstadoTriageAsync(int triageId, string nuevoEstado, string? consultorio = null);
    Task<List<Mascota>> GetMascotasActivasConUsuarioAsync();
}
