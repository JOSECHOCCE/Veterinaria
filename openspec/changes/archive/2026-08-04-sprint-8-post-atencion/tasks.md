# Tasks: Sprint 8 — Post-atención y Recordatorios Automáticos

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~350-420 lines |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Post-care follow-up & vaccine reminder module | PR 1 | `dotnet test --filter "FullyQualifiedName~PostAtencionService"` | Unit tests | `PostAtencionService.cs` + entities + controller |

---

## Phase 1: Domain Entities & Infrastructure

- [x] 1.1 Create `SeguimientoPostAtencion.cs` in `Veterinaria.Domain/Entities/`.
- [x] 1.2 Create `RecordatorioVacuna.cs` in `Veterinaria.Domain/Entities/`.
- [x] 1.3 Add `DbSet<SeguimientoPostAtencion>` and `DbSet<RecordatorioVacuna>` to `VeterinariaDbContext.cs`.

## Phase 2: Core Business Logic (Strict TDD: RED → GREEN → REFACTOR)

- [x] 2.1 **TDD RED (failing tests first)**: Create `PostAtencionServiceTests.cs` in `Veterinaria.Tests/Application/` covering:
  - Follow-up scheduling 24h after consultation closure.
  - Logging favorable response updates status to `"Contactado"`.
  - Logging complication updates status to `"Revisión Requerida"`, sets `RequiereAtencionUrgente = true`, and emits `Warning` notification.
  - Vaccination booster scheduling creates `RecordatorioVacuna` entry.
  - Daily reminder batch processor emits alert notifications 3 days before due date.
  - Run `dotnet test` and verify failure.
- [x] 2.2 **TDD GREEN (implementation)**: Create `IPostAtencionService.cs` and implement `PostAtencionService.cs` with complete post-care and reminder logic.
- [x] 2.3 **TDD REFACTOR**: Clean up code and verify all unit tests pass in **🟢 GREEN**.

## Phase 3: Controller Endpoints & API Integration

- [x] 3.1 Create `PostAtencionController.cs` in `Veterinaria.Web/Controllers/` exposing reception worklists, status updates, and reminder endpoints.
- [x] 3.2 Execute `dotnet test` to confirm 100% passing test suite across all unit tests.
