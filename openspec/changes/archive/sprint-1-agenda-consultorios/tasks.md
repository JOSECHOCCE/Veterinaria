# Tasks: Sprint 1 — Agenda y Gestión de Espacios Físicos (Consultorios)

- **Change Name**: `sprint-1-agenda-consultorios`
- **Target Stories**: `HU-001`, `HU-002`, `HU-021` a `HU-029`
- **Status**: Tasks Defined

---

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | ~280 lines |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Delivery strategy | single-pr |

Decision needed before apply: No
Chained PRs recommended: No
400-line budget risk: Low

---

## Implementation Tasks

### Task 1: Domain Entities & Enum (`HU-026`, `RF-086`)
- [x] Create `src/Backend/Veterinaria.Domain/Entities/Consultorio.cs`.
- [x] Add `ConsultorioId` FK & navigation property to `Cita.cs`.

### Task 2: Infrastructure & Database Seeding (`HU-026`, `RF-086`)
- [x] Add `DbSet<Consultorio>` and Fluent API relationship in `VeterinariaDbContext.cs`.
- [x] Seed default physical spaces (`Consultorio 1`, `Consultorio 2`, `Sala de Procedimientos`, `Área de Grooming`) in `DbSeeder.cs`.

### Task 3: Application DTOs & Service Contracts (`HU-027`, `HU-029`)
- [x] Create `ConsultorioDto.cs`, `CrearConsultorioDto.cs`, `OcupacionConsultorioDto.cs`.
- [x] Create `IConsultorioService.cs` & `ConsultorioService.cs`.

### Task 4: Auto-Assignment & Conflict Prevention Logic (`HU-027`, `HU-028`)
- [x] Extend `CitaService.cs` to auto-assign a free matching `Consultorio` when creating appointments.
- [x] Implement physical room overlap rejection in `CitaService.cs`.

### Task 5: Web API Controller (`HU-026`, `HU-029`)
- [x] Create `ConsultoriosController.cs` (`GET /api/consultorios`, `POST /api/consultorios`, `GET /api/consultorios/ocupacion`).

### Task 6: Unit Testing & Quality Verification (`TDD`)
- [x] Create `ConsultorioServiceTests.cs` and add room conflict test cases in `CitaServiceTests.cs`.
- [x] Execute `dotnet test` to confirm 100% test suite success.
