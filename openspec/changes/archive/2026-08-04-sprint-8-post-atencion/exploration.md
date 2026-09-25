# Exploration: Sprint 8 — Post-atención y Recordatorios Automáticos

## Current State

The system currently handles clinical appointments (`Cita`), SOAP clinical histories (`HistorialClinico`), medical prescriptions (`Receta`), and general notifications (`Notificacion`).

However:
- There is no structured entity or workflow to track **post-consultation patient follow-ups** (`SeguimientoPostAtencion`), leaving post-surgical recovery monitoring unrecorded.
- There is no dedicated **vaccination / deworming schedule tracker** (`RecordatorioVacuna`), forcing staff to manually check history notes for upcoming booster dates.

## Requirements & Real-World Veterinary Context

1. **Post-Attention Medical Follow-up (`HU-016`, `RF-018`):**
   - After completing a consultation or surgery, a `SeguimientoPostAtencion` task is scheduled for 24-48 hours later.
   - Staff records patient recovery status (`"Favorable"`, `"Estable"`, `"Revisión Requerida"`).
   - Generates notifications for receptionists/vets to contact pet owners.

2. **Automated Vaccination & Deworming Reminders (`HU-017`, `RF-019`):**
   - Tracks booster dates for vaccines (Rabies, Parvovirus, Triple Canina/Felina) and internal/external deworming.
   - Creates a `RecordatorioVacuna` entry with `FechaVencimiento`.
   - Sends automated alerts to pet owners 3 days prior and on the day of the booster.

## Affected Areas

- `src/Backend/Veterinaria.Domain/Entities/SeguimientoPostAtencion.cs` — **[NEW]** Entity to track post-care follow-ups
- `src/Backend/Veterinaria.Domain/Entities/RecordatorioVacuna.cs` — **[NEW]** Entity for vaccine/deworming schedules
- `src/Backend/Veterinaria.Infrastructure/Persistence/VeterinariaDbContext.cs` — **[MODIFY]** Add `DbSet<SeguimientoPostAtencion>` and `DbSet<RecordatorioVacuna>`
- `src/Backend/Veterinaria.Application/Services/PostAtencionService.cs` — **[NEW]** Business logic service for post-care follow-up and vaccination reminders
- `src/Backend/Veterinaria.Web/Controllers/PostAtencionController.cs` — **[NEW]** Controller endpoints for staff management & pet owner reminders
- `src/Backend/Veterinaria.Tests/Application/PostAtencionServiceTests.cs` — **[NEW]** Unit test suite for post-care tracking and reminder scheduling

## Approaches

### 1. **Dedicated PostAtencion Module (Recommended)**
- Create `SeguimientoPostAtencion` and `RecordatorioVacuna` entities decoupled from `Cita` and `HistorialClinico`.
- **Pros**: Clean separation of concerns, easy queries for daily follow-up calls, automatic integration with `INotificacionService`.
- **Cons**: Requires 2 new domain entities and repository configurations.
- **Effort**: Medium

### 2. **Generic Text Notes on Citas**
- Store follow-up notes inside `HistorialClinico.Recomendaciones` or `Cita.Notas`.
- **Pros**: Zero database schema additions.
- **Cons**: Impossible to query pending follow-up lists cleanly or send targeted automated vaccination alerts.
- **Effort**: Low (but non-compliant with requirements)

## Recommendation

Implement **Approach 1 (Dedicated PostAtencion Module)**. It provides a robust, scalable architecture matching real-world veterinary clinic operations where receptionists review daily follow-up lists and clients receive automated vaccination booster reminders.

## Risks

- **Data Integrity**: Ensure follow-up records correctly cascade or nullify if a clinical appointment is canceled.
- **Notification Spam**: Guard against creating duplicate reminders for the same vaccine booster date.

## Ready for Proposal

**Yes** — Exploration complete. Ready to proceed to `sdd-propose` for Sprint 8 (`sprint-8-post-atencion`).
