# Tasks: Sprint 7 — Botica / Venta Directa en Mostrador

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~250-320 lines |
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
| 1 | Prescription validation & counter sale Kardex audit | PR 1 | `dotnet test --filter "FullyQualifiedName~VentaService"` | Unit tests | `VentaService.cs` + `Venta.cs` + `VentasController.cs` |

---

## Phase 1: Domain Entities & DTO Extensions

- [x] 1.1 Update `Venta.cs` in `Veterinaria.Domain/Entities/` to add optional `RecetaId` foreign key and relation.
- [x] 1.2 Update `VentaDto.cs` in `Veterinaria.Web/Models/Dto/` to include `RecetaId`.

## Phase 2: Core Business Logic (Strict TDD: RED → GREEN → REFACTOR)

- [x] 2.1 **TDD RED (failing tests first)**: Add unit tests in `VentaServiceTests.cs` covering:
  - OTC counter sale (`RequiereReceta == false`) succeeds, deducts stock, and logs `SalidaVenta` Kardex entry.
  - Restricted drug sale (`RequiereReceta == true`) without `RecetaId` fails with `InvalidOperationException`.
  - Restricted drug sale with invalid/unmatching `RecetaId` fails with explicit error message.
  - Restricted drug sale with valid matching `RecetaId` succeeds, deducts stock, and logs `SalidaVenta` Kardex entry.
  - Run `dotnet test` and verify failure.
- [x] 2.2 **TDD GREEN (implementation)**: Update `VentaService.RegistrarVentaAsync` to evaluate `RequiereReceta`, validate `RecetaId`, deduct stock, and log `MovimientoInventario` with `TipoMovimiento = "SalidaVenta"`.
- [x] 2.3 **TDD REFACTOR**: Clean up LINQ queries and verify all unit tests pass in **🟢 GREEN**.

## Phase 3: Controller Endpoints & API Integration

- [x] 3.1 Update `VentasController.cs` to handle prescription validation errors and expose botica catalog search.
- [x] 3.2 Execute `dotnet test` to confirm 100% passing test suite across all unit tests.
