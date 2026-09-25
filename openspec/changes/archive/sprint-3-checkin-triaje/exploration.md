# Exploration: Sprint 3 — Check-in y Triaje (HU-005, HU-006)

## Current State
Currently, the domain entities `Cita` and `Triage` exist in `Veterinaria.Domain.Entities`.
- `Cita.cs` manages appointment state (`Pendiente`, `Confirmada`, `EnProceso`, `Completada`, `Cancelada`, `NoAsistio`).
- `Triage.cs` records vital signs and urgency levels (`N1` Emergencia, `N2` Urgente, `N3` No Urgente), with queue ordering by urgency level and registration time.
- `CitaService.cs` manages calendar appointments, rescheduling, and cancellations, but lacks a dedicated `CheckInAsync(citaId)` method to transition `Cita.Estado` to `EnSalaDeEspera` and auto-register/link to triaje queue.
- `TriageService.cs` provides basic CRUD (`GetColaTriageAsync`, `AddTriageAsync`, `UpdateTriageAsync`), but needs integration with `Cita` lifecycle and automatic queue re-sorting by priority color / urgency level.
- Frontend views `ColaAtencion.tsx` and `Triage.tsx` exist under `src/Frontend/src/views/Atencion/`, but require API alignment for seamless patient check-in from the daily agenda.

## Affected Areas
- `src/Backend/Veterinaria.Domain/Entities/Cita.cs` — Ensure state `EnSalaDeEspera` is officially recognized in valid states.
- `src/Backend/Veterinaria.Domain/Entities/Triage.cs` — Verify vital signs properties (Temperatura, FrecuenciaCardiaca, FrecuenciaRespiratoria, PesoEstimado, Nivel, PrioridadColor).
- `src/Backend/Veterinaria.Application/Services/CitaService.cs` & `ICitaService.cs` — Implement `CheckInCitaAsync(int citaId)` method with audit logging and automatic triaje queue entry.
- `src/Backend/Veterinaria.Application/Services/TriageService.cs` & `ITriageService.cs` — Enhance triaje queue logic, priority escalation, and consultation handoff.
- `src/Backend/Veterinaria.Web/Controllers/CitasController.cs` — Expose POST `/api/citas/{id}/check-in` endpoint.
- `src/Backend/Veterinaria.Web/Controllers/TriageController.cs` — Ensure full endpoints for triaje intake, vital signs update, and queue status change.
- `src/Frontend/src/views/Atencion/Triage.tsx` & `src/Frontend/src/views/Atencion/ColaAtencion.tsx` — Connect Check-in button from Citas agenda to Triaje intake modal.
- `src/Backend/Veterinaria.Tests/Application/CitaServiceTests.cs` & `TriageServiceTests.cs` — Add unit tests for check-in transition, triaje priority ordering, and invalid state rejection.

## Approaches

### Option A: Direct Check-in in CitaService with explicit Triage creation (Recommended)
- **Description**: Add `CheckInCitaAsync(int citaId)` in `CitaService` which sets `Cita.Estado = "EnSalaDeEspera"`, creates a default `Triage` entry with status `"EnEspera"` linked to `citaId` and `mascotaId`, and commits both in a single transaction unit.
- **Pros**:
  - Clean atomic transaction via `IUnitOfWork`.
  - Guarantees every checked-in patient immediately appears on the Triaje queue without manual dual entry.
  - Seamless UX for reception staff (1 click "Check-in").
- **Cons**:
  - Couples `CitaService` with `Triage` repository.
- **Effort**: Medium

### Option B: Separate Reception API endpoints
- **Description**: Reception staff manually completes Check-in on Cita, and then separately navigates to Triaje form to register patient.
- **Pros**:
  - Decoupled service logic.
- **Cons**:
  - Risk of human error (checking in appointment but forgetting triaje intake).
  - Extra clicks for staff.
- **Effort**: Low

## Recommendation
**Option A** is strongly recommended. Automatic triaje queue creation upon Cita check-in eliminates reception friction, prevents lost patients in waiting rooms, and adheres to real-world veterinary clinic workflows.

## Risks & Mitigations
- **Risk**: Patient checked in without an appointment (walk-in / emergency).
  - *Mitigation*: Support standalone `Triage` creation with `CitaId = null` for direct walk-in emergencies (already supported by `Triage.cs`).
- **Risk**: Re-checking in an already checked-in or completed appointment.
  - *Mitigation*: Validate state transition in `CitaService.CheckInCitaAsync` (only allow from `Confirmada` or `Pendiente`).

## Ready for Proposal
**Yes** — Ready to proceed to `sdd-propose` for Sprint 3 (Check-in y Triaje).
