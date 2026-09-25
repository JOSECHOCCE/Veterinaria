# Technical Design: Sprint 3 — Check-in y Triaje

## System Architecture

```
[ Frontend: React / Vite ]
    │
    ├─> POST /api/citas/{id}/check-in ──> CitasController ──> CitaService.CheckInCitaAsync()
    │                                                               │
    │                                                               ├──> Update Cita.Estado = "EnSalaDeEspera"
    │                                                               └──> Add Triage (Estado = "EnEspera")
    │                                                                         │
    └─> PUT /api/triage/{id}/signos ──> TriageController ──> TriageService ───┴──> UnitOfWork.CommitAsync()
```

## Backend Component Specification

### 1. CitaService (`ICitaService.cs` & `CitaService.cs`)
```csharp
public async Task<Cita> CheckInCitaAsync(int citaId)
{
    var cita = await _unitOfWork.Citas.GetByIdAsync(citaId);
    if (cita == null)
        throw new KeyNotFoundException($"No se encontró la cita con ID {citaId}.");

    if (cita.Estado != "Pendiente" && cita.Estado != "Confirmada")
        throw new InvalidOperationException($"No se puede realizar check-in a una cita en estado '{cita.Estado}'.");

    cita.Estado = "EnSalaDeEspera";
    _unitOfWork.Citas.Update(cita);

    // Verificar si ya existe triaje vinculado
    var existingTriage = await _unitOfWork.Triages.GetAll()
        .FirstOrDefaultAsync(t => t.CitaId == citaId);

    if (existingTriage == null)
    {
        var nuevoTriage = new Triage
        {
            CitaId = cita.Id,
            MascotaId = cita.MascotaId,
            Nivel = cita.EsUrgencia ? "N1" : "N3",
            PrioridadColor = cita.EsUrgencia ? "Rojo" : "Verde",
            Sintomas = cita.Motivo,
            MotivoConsulta = cita.Motivo,
            Estado = "EnEspera",
            Consultorio = "Sala de Espera",
            TiempoEsperaEstimadoMin = cita.EsUrgencia ? 0 : 15,
            FechaRegistro = DateTime.Now
        };
        await _unitOfWork.Triages.AddAsync(nuevoTriage);
    }

    await _unitOfWork.CommitAsync();
    await _auditoriaService.RegistrarAccionAsync("CheckIn", "Cita", cita.Id.ToString(), $"Check-in realizado para paciente MascotaId={cita.MascotaId}.");

    return cita;
}
```

### 2. TriageService (`ITriageService.cs` & `TriageService.cs`)
```csharp
public async Task<Triage> RegistrarSignosVitalesAsync(int triageId, string nivel, string? sintomas, decimal? temperatura, int? fc, decimal? peso)
{
    var triage = await _unitOfWork.Triages.GetByIdAsync(triageId);
    if (triage == null)
        throw new KeyNotFoundException($"Triaje con ID {triageId} no encontrado.");

    triage.Nivel = nivel;
    triage.PrioridadColor = nivel switch {
        "N1" => "Rojo",
        "N2" => "Naranja",
        _ => "Verde"
    };
    triage.Sintomas = sintomas ?? triage.Sintomas;
    triage.Temperatura = temperatura;
    triage.FrecuenciaCardiaca = fc;
    triage.PesoEstimado = peso;

    _unitOfWork.Triages.Update(triage);
    await _unitOfWork.CommitAsync();
    return triage;
}
```

### 3. Controller Endpoints
- `POST /api/citas/{id}/check-in` in `CitasController.cs`
- `PUT /api/triage/{id}/signos-vitales` in `TriageController.cs`
- `PUT /api/triage/{id}/atender` in `TriageController.cs` (changes status to `EnAtencion`)

## Frontend Component Alignment
- `MiAgenda.tsx` / `ColaAtencion.tsx`: Add **"Check-in"** button next to today's confirmed appointments.
- `Triage.tsx`: Render priority badges (Red/Orange/Green), input fields for vital signs, and "Pasar a Consulta" action.

## Testing Strategy
- **Unit Tests**:
  - `CheckInCitaAsync_CuandoCitaConfirmada_DebeCambiarEstadoYCrearTriage`
  - `CheckInCitaAsync_CuandoCitaCancelada_DebeLanzarExcepcion`
  - `GetColaTriageAsync_OrdersN1FirstThenN2ThenN3`
  - `RegistrarSignosVitales_UpdatesTriageColorAndVitals`
