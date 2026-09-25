# Tasks Breakdown: Sprint 9 — Seguridad, Reportes y Cumplimiento

## Implementation Strategy & TDD Workflow
This task breakdown enforces **Strict TDD (RED → GREEN → REFACTOR)**.
- **Baseline Safety Net**: Execute `dotnet test` and confirm all 288 existing unit tests pass 100%.
- **RED State**: Write unit tests in `SeguridadReportesTests.cs` and verify compilation/assertion failure.
- **GREEN State**: Implement entities, DbContext updates, services, and controllers to make tests pass.
- **REFACTOR State**: Clean up code and verify 293+ tests pass cleanly.

---

## Task Checklist

### Phase 1: Domain Entities & Infrastructure Setup
- [x] 1.1 Create `AuditoriaLog.cs` entity in `Veterinaria.Domain/Entities/`.
- [x] 1.2 Update `Usuario.cs` adding `EsAnonimizado` and `FechaAnonimizacion` properties.
- [x] 1.3 Update `VeterinariaDbContext.cs` adding `DbSet<AuditoriaLog>`.
- [x] 1.4 Update `IUnitOfWork.cs` and `UnitOfWork.cs` adding `AuditoriaLogs` repository property.

### Phase 2: Core Business Logic (Strict TDD: RED → GREEN → REFACTOR)
- [x] 2.1 **TDD RED (failing tests first)**: Create `SeguridadReportesTests.cs` in `Veterinaria.Tests/Application/` covering:
  - Anonymizing a client replaces DNI, email, phone, and address with masked values.
  - Anonymized client's pets and medical histories remain fully linked and accessible for audit.
  - Executing anonymization records an entry in `AuditoriaLog`.
  - Financial report desaggregates revenue into Services, Pharmacy, and Petshop totals.
  - Audit service retrieves and filters logs by date range.
  - Run `dotnet test` and verify failure.
- [x] 2.2 **TDD GREEN (implementation)**:
  - Create `IAnonymizationService.cs` & `AnonymizationService.cs`.
  - Create `IReporteService.cs` & `ReporteService.cs`.
  - Update `IAuditoriaService.cs` & `AuditoriaService.cs`.
  - Register services in `Program.cs`.
  - Run `dotnet test` and verify pass.
- [x] 2.3 **TDD REFACTOR**: Clean up LINQ queries and verify 293+ unit tests pass cleanly.

### Phase 3: Controllers & Security Enforcement (RBAC)
- [x] 3.1 Create `SeguridadController.cs` exposing anonymization and audit log endpoints (`[Authorize(Roles = "Admin")]`).
- [x] 3.2 Create `ReportesController.cs` exposing categorized financial revenue endpoints with 403 restriction for non-Admin roles.
- [x] 3.3 Execute full `dotnet test` suite to confirm 100% passing test suite across all 293+ tests.
