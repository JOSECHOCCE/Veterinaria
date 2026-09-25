# Tasks: Sprint 2 — Notificaciones y Cancelación con Lista de Espera

- **Change Name**: `sprint-2-notificaciones-cancelaciones`
- **Target Stories**: `HU-003`, `HU-004`
- **Status**: Tasks Defined

---

## Review Workload Forecast

- **Estimated new/modified lines**: ~220
- **Risk**: Low (new isolated entity + extensions to existing services)
- **Correction budget**: ~110 lines

---

## Task List

### Task 1: ListaEspera Domain Entity (HU-004, RF-009)
- **File**: `[NEW] Domain/Entities/ListaEspera.cs`
- **Action**: Create entity with Id, MascotaId, ServicioId, VeterinarioPreferidoId?, FechaDeseada, FechaDeseadaFin, Estado, FechaCreacion, FechaNotificacion?, navigation properties.
- **Acceptance**: Entity compiles, follows existing entity conventions.

### Task 2: Infrastructure — DbContext + UnitOfWork (HU-004, RF-009)
- **File**: `[MODIFY] Infrastructure/Persistence/VeterinariaDbContext.cs`
- **File**: `[MODIFY] Domain/Contracts/IUnitOfWork.cs`
- **File**: `[MODIFY] Infrastructure/Persistence/UnitOfWork.cs`
- **Action**: Add `DbSet<ListaEspera>`, add `IGenericRepository<ListaEspera> ListaEsperas` to IUnitOfWork and UnitOfWork.
- **Acceptance**: EF Core recognizes the new entity. Build succeeds.

### Task 3: NotificacionService — Lista de Espera Notification (HU-004, RF-009)
- **File**: `[MODIFY] Application/Interfaces/INotificacionService.cs`
- **File**: `[MODIFY] Application/Services/NotificacionService.cs`
- **Action**: Add `NotificarListaEsperaDisponibleAsync(ListaEspera entry, Cita citaCancelada)` method. Creates in-app notification + email to the waitlisted user.
- **Acceptance**: Method sends notification with "📋 Cupo Disponible" title.

### Task 4: CitaService — Extend CancelarCitaAsync (HU-004, RF-009)
- **File**: `[MODIFY] Application/Services/CitaService.cs`
- **Action**: After successful cancellation (commit + audit), query ListaEspera for matching Pendiente entries. Notify first match via NotificacionService. Update entry to "Notificada".
- **Acceptance**: Cancelling a cita with waitlist match triggers notification. Without waitlist match, no change.

### Task 5: CitaStatusService — 2h Reminder (HU-003, RF-007)
- **File**: `[MODIFY] Web/Services/CitaStatusService.cs`
- **Action**: Add 2h reminder block after existing 24h block. Window: 1h-3h from now. Deduplicate same as 24h.
- **Acceptance**: Citas within 1-3h receive "Recordatorio" notification if not already sent.

### Task 6: ListaEsperaController — CRUD API (HU-004, RF-009)
- **File**: `[NEW] Web/Controllers/ListaEsperaController.cs`
- **Action**: POST, GET, DELETE endpoints for lista de espera management.
- **Acceptance**: API returns correct status codes. Authorized access only.

### Task 7: Unit Tests (TDD validation)
- **Files**: New/modified test files.
- **Action**: Add tests for: 2h reminder dedup, waitlist notification on cancel, waitlist CRUD, ListaEspera entity.
- **Acceptance**: All new + existing tests pass. Target ≥ 269 total.
