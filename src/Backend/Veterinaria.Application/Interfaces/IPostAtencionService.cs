using System.Collections.Generic;
using System.Threading.Tasks;
using Veterinaria.Domain.Entities;

namespace Veterinaria.Application.Interfaces;

public interface IPostAtencionService
{
    Task<SeguimientoPostAtencion> ProgramarSeguimientoPostAtencionAsync(int historialClinicoId);
    Task<SeguimientoPostAtencion> RegistrarResultadoSeguimientoAsync(int seguimientoId, string estado, string? evolucion, string? notas, bool requiereAtencionUrgente);
    Task<IEnumerable<SeguimientoPostAtencion>> ObtenerSeguimientosPendientesAsync();
    Task<RecordatorioVacuna> ProgramarRecordatorioVacunaAsync(RecordatorioVacuna recordatorio);
    Task<IEnumerable<RecordatorioVacuna>> ObtenerRecordatoriosPendientesAsync(int? clienteId = null);
    Task<int> ProcesarNotificacionesRecordatoriosDiariosAsync();
}
