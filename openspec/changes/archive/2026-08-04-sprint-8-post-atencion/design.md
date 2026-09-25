# Design: Sprint 8 — Post-atención y Recordatorios Automáticos

## Technical Approach

Introduce a dedicated `PostAtencion` module implementing post-care patient status tracking (`SeguimientoPostAtencion`) and preventive vaccination booster reminder scheduling (`RecordatorioVacuna`).

The module seamlessly interfaces with `HistorialClinicoService` and `INotificacionService` to schedule 24-48h follow-up phone calls after consultation/surgery closure and trigger automated reminder notifications to pet owners 3 days prior to booster due dates.

## Architecture Decisions

| Decision | Choice | Alternatives Considered | Rationale |
|----------|--------|-------------------------|-----------|
| **Dedicated Domain Entities** | Create `SeguimientoPostAtencion` and `RecordatorioVacuna` entities | Adding string fields in `HistorialClinico` | Provides clean domain separation, optimized queries for daily receptionist call lists, and structured tracking of patient recovery status. |
| **Notification Integration** | Integrate directly with `INotificacionService` | External third-party SMS queue | Reuses existing internal notification engine and Client Portal alert system without unverified external API dependencies. |
| **Urgent Attention Escalate** | Set `RequiereAtencionUrgente = true` and send `Warning` notification when `Revisión Requerida` is logged | Manual verbal notification only | Guarantees attending veterinarians receive immediate system alerts when post-care complications are reported by owners. |

## Data Flow

```
[HistorialClinico Closed]
       │
       ▼
 [PostAtencionService.ProgramarSeguimientoPostAtencionAsync]
       │
       ├────► [Insert SeguimientoPostAtencion (Estado = "Pendiente", FechaProgramada = +24h)]
       │
 Staff Contact & Input:
       │
       ▼
 [PostAtencionService.RegistrarResultadoSeguimientoAsync]
       │
       ├─ If "Revisión Requerida" ──► [Set RequiereAtencionUrgente = true & Notify Vet (Warning)]
       └─ If "Favorable" ───────────► [Set Estado = "Contactado"]
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/Backend/Veterinaria.Domain/Entities/SeguimientoPostAtencion.cs` | Create | Entity tracking 24-48h patient recovery follow-ups |
| `src/Backend/Veterinaria.Domain/Entities/RecordatorioVacuna.cs` | Create | Entity tracking vaccine & deworming booster dates |
| `src/Backend/Veterinaria.Infrastructure/Persistence/VeterinariaDbContext.cs` | Modify | Register `DbSets` for new entities |
| `src/Backend/Veterinaria.Application/Interfaces/IPostAtencionService.cs` | Create | Service interface for post-care & reminder logic |
| `src/Backend/Veterinaria.Application/Services/PostAtencionService.cs` | Create | Service implementation for post-care management |
| `src/Backend/Veterinaria.Web/Controllers/PostAtencionController.cs` | Create | Controller endpoints for receptionist worklists & reminders |
| `src/Backend/Veterinaria.Tests/Application/PostAtencionServiceTests.cs` | Create | Unit test suite covering follow-up and reminder flows |

## Interfaces / Contracts

```csharp
public class SeguimientoPostAtencion
{
    public int Id { get; set; }
    public int HistorialClinicoId { get; set; }
    public int MascotaId { get; set; }
    public int ClienteId { get; set; }
    public int? VeterinarioId { get; set; }
    public DateTime FechaProgramada { get; set; }
    public DateTime? FechaContacto { get; set; }
    public string Estado { get; set; } = "Pendiente"; // "Pendiente", "Contactado", "SinRespuesta", "Revisión Requerida"
    public string? EvolucionPaciente { get; set; } // "Favorable", "Estable", "Complicación"
    public string? NotasSeguimiento { get; set; }
    public bool RequiereAtencionUrgente { get; set; } = false;
}

public class RecordatorioVacuna
{
    public int Id { get; set; }
    public int MascotaId { get; set; }
    public int ClienteId { get; set; }
    public string TipoPrevencion { get; set; } = "Vacuna"; // "Vacuna", "Desparasitación", "Control"
    public string NombreVacuna { get; set; } = string.Empty;
    public DateTime FechaVencimiento { get; set; }
    public DateTime? FechaEnvioNotificacion { get; set; }
    public string Estado { get; set; } = "Programado"; // "Programado", "Notificado", "Atendido"
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Schedule follow-up on consultation completion | Verify `SeguimientoPostAtencion` created with 24h delay |
| Unit | Log favorable follow-up response | Verify status updated to `"Contactado"` and notes saved |
| Unit | Log complication response (`"Revisión Requerida"`) | Verify `RequiereAtencionUrgente == true` and `Warning` notification sent |
| Unit | Schedule vaccine reminder | Verify `RecordatorioVacuna` created with `"Programado"` status |
| Unit | Daily reminder batch processor | Verify notification sent for reminders due in <= 3 days |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No migration script required for EF Core InMemory unit tests; standard EF Core migration adds `SeguimientosPostAtencion` and `RecordatoriosVacunas` tables.

## Open Questions

None — Design matches requirements `HU-016`, `HU-017`, `RF-018`, and `RF-019`.
