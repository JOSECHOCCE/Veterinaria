# Proposal: Sprint 3 — Check-in y Triaje (HU-005, HU-006)

## Intent
Provide reception and clinical staff with an integrated workflow for patient check-in (`HU-005`) upon arrival at the clinic, automatically placing appointments into the waiting room queue, and recording vital signs and urgency levels during triaje intake (`HU-006`).

## Scope

### In Scope
- `HU-005`: Check-in action for confirmed appointments that transitions status to `EnSalaDeEspera` and auto-registers an entry in the triaje queue.
- `HU-006`: Vital signs registration (Temperature, Heart Rate, Respiratory Rate, Weight, Urgency Level N1/N2/N3) and priority color tagging (Red, Orange, Green).
- Automatic priority sorting for the triaje queue (`N1` > `N2` > `N3`, then by registration time).
- Direct walk-in triaje entry without prior appointment (`CitaId = null`).
- Status transition of triaje entry (`EnEspera` -> `EnAtencion` -> `Atendido`).

### Out of Scope
- Medical SOAP consultation recording (`HU-007` — Sprint 4).
- Automatic prescription/billing generation (`HU-009`/`HU-010` — Sprint 4/6).

## Capabilities

### New Capabilities
- `checkin-triaje`: Handles patient reception check-in, vital signs recording, urgency classification (N1/N2/N3), and queue prioritization.

### Modified Capabilities
- None

## Approach
Implement `CheckInCitaAsync(int citaId)` in `CitaService` to validate state transition (`Confirmada` / `Pendiente` -> `EnSalaDeEspera`), create a linked `Triage` entry (`Estado = "EnEspera"`), and commit via `IUnitOfWork` in a single transaction. Extend `TriageService` to handle vital signs update, priority escalation, and queue querying. Update API controllers and React UI views accordingly.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/Backend/Veterinaria.Domain/Entities/Cita.cs` | Modified | Add/verify `EnSalaDeEspera` status constant |
| `src/Backend/Veterinaria.Application/Services/CitaService.cs` | Modified | Implement `CheckInCitaAsync` method |
| `src/Backend/Veterinaria.Application/Services/TriageService.cs` | Modified | Enhance `GetColaTriageAsync` sorting & vital signs registration |
| `src/Backend/Veterinaria.Web/Controllers/CitasController.cs` | Modified | Add `POST /api/citas/{id}/check-in` endpoint |
| `src/Backend/Veterinaria.Web/Controllers/TriageController.cs` | Modified | Expose triaje intake and queue endpoints |
| `src/Frontend/src/views/Atencion/Triage.tsx` | Modified | Connect vital signs form & queue ordering |
| `src/Frontend/src/views/Atencion/ColaAtencion.tsx` | Modified | Connect check-in action & queue status |
| `src/Backend/Veterinaria.Tests/Application/CitaServiceTests.cs` | Modified | Unit tests for Check-in workflow |
| `src/Backend/Veterinaria.Tests/Application/TriageServiceTests.cs` | Modified | Unit tests for Triaje queue sorting & vital signs |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Duplicate check-in on already checked-in appointment | Low | Validate `Cita.Estado` before transition in `CitaService` |
| Patient without appointment arrives for emergency | Low | Support `CitaId = null` for direct walk-in triaje intake |

## Rollback Plan
Revert commit changes. No database migration is required as `Cita` and `Triage` tables already exist with compatible schemas.

## Success Criteria
- [ ] Reception can perform check-in on confirmed appointment with 1 click.
- [ ] Checked-in patient automatically appears on Triaje queue with `EnEspera` status.
- [ ] Triaje form allows entering vital signs (Temp, HR, RR, Weight, N1/N2/N3).
- [ ] Triaje queue sorts `N1` emergencies first, then `N2`, then `N3`.
- [ ] 100% passing unit tests in `Veterinaria.Tests`.
