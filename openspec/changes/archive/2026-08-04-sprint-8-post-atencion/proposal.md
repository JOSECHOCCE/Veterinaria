# Proposal: Sprint 8 — Post-atención y Recordatorios Automáticos

## Intent

Implement structured patient post-attention follow-up tracking (`SeguimientoPostAtencion`, `HU-016`) and automated vaccination/deworming reminders (`RecordatorioVacuna`, `HU-017`) to elevate veterinary care quality, ensure post-surgical recovery monitoring, and maintain pet immunization schedules.

## Scope

### In Scope
- **Post-Care Patient Follow-up (`HU-016`, `RF-018`):** Create `SeguimientoPostAtencion` record upon completing consultations or surgeries to schedule follow-up calls (24-48h later) and log patient status (`"Favorable"`, `"Estable"`, `"Revisión Requerida"`).
- **Automated Vaccine Reminders (`HU-017`, `RF-019`):** Create `RecordatorioVacuna` record for vaccine boosters/deworming dates, integrating with `INotificacionService` to send automatic alerts 3 days before and on the due date.
- **Staff Worklist Endpoint:** Expose endpoints for receptionists and vets to view pending follow-ups and upcoming vaccination schedules.

### Out of Scope
- Automated WhatsApp/SMS gateway integration (uses internal `INotificacionService` and Client Portal notifications).
- External laboratory integration.

## Capabilities

### New Capabilities
- `post-atencion-recordatorios`: Manages post-attention patient recovery tracking and automated vaccination/deworming booster reminder alerts.

### Modified Capabilities
None.

## Approach

Create two domain entities `SeguimientoPostAtencion` and `RecordatorioVacuna` mapped in `VeterinariaDbContext`. Implement `PostAtencionService` containing:
1. `ProgramarSeguimientoAsync` & `RegistrarResultadoSeguimientoAsync` for post-care call management.
2. `ProgramarRecordatorioVacunaAsync` & `ObtenerRecordatoriosPendientesAsync` for vaccination alerts.

Expose these capabilities via `PostAtencionController` endpoints and write a comprehensive unit test suite in `PostAtencionServiceTests`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/Backend/Veterinaria.Domain/Entities/SeguimientoPostAtencion.cs` | New | Post-care follow-up tracking entity |
| `src/Backend/Veterinaria.Domain/Entities/RecordatorioVacuna.cs` | New | Vaccine & deworming booster schedule entity |
| `src/Backend/Veterinaria.Infrastructure/Persistence/VeterinariaDbContext.cs` | Modified | Add `DbSets` for new entities |
| `src/Backend/Veterinaria.Application/Services/PostAtencionService.cs` | New | Business service logic for post-care & reminders |
| `src/Backend/Veterinaria.Web/Controllers/PostAtencionController.cs` | New | REST API endpoints |
| `src/Backend/Veterinaria.Tests/Application/PostAtencionServiceTests.cs` | New | Unit test suite |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Duplicate reminder alerts | Low | Check existing scheduled reminders for the same pet and booster date before creating new ones |
| Unfollowed high-risk post-surgical cases | Low | Highlight `"Revisión Requerida"` status with `Warning` type notifications for staff |

## Rollback Plan

Delete `SeguimientoPostAtencion` and `RecordatorioVacuna` entities and restore `VeterinariaDbContext` if reverted.

## Dependencies

- Existing `INotificacionService` for alert delivery.
- Existing `HistorialClinico` and `Mascota` entities.

## Success Criteria

- [ ] Successful scheduling and status logging of post-consultation/surgery follow-ups (`HU-016`).
- [ ] Automated generation of vaccine/deworming booster alerts 3 days prior and on due date (`HU-017`).
- [ ] 100% unit test pass rate across new and existing tests.
