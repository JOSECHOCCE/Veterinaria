# Tasks: Sprint 5 — Inventario Clínico, Punto de Reorden Dinámico (ROP) y Registro de Mermas

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 250-350 lines |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | ROP calculation, Kardex & Waste endpoints | Single PR | `dotnet test --filter "ProductoServiceTests"` | MSTest InMemory DB | `Producto.cs`, `ProductoService.cs`, `MovimientoInventario.cs` |

---

## Phase 1: Foundation & Domain Models

- [ ] 1.1 Update `Producto.cs` (add `LeadTimeDias`, `StockSeguridad`, `FechaVencimiento`).
- [ ] 1.2 Create `MovimientoInventario.cs` entity (Kardex audit log: `ProductoId`, `TipoMovimiento`, `Cantidad`, `Motivo`, `UsuarioId`, `FechaRegistro`).
- [ ] 1.3 Update `VeterinariaDbContext.cs`, `IUnitOfWork.cs`, and `UnitOfWork.cs` to expose `MovimientosInventario` DbSet & Repository.

## Phase 2: TDD Red & Green — Application Services

- [ ] 2.1 **[RED]** Create `ProductoServiceTests.cs` with failing tests for dynamic ROP calculation, new product `StockMinimo` fallback, and `RegistrarMermaAsync` Kardex logging.
- [ ] 2.2 **[GREEN]** Update `IProductoService.cs` and implement `CalcularRopDinamicoAsync`, `RegistrarMermaAsync`, and `GetAlertasInventarioAsync` in `ProductoService.cs` to pass unit tests.

## Phase 3: Web API Controllers & Integration

- [ ] 3.1 Create DTOs `RegistrarMermaDto` and `ProductoAlertaDto` in `Veterinaria.Application/DTOs`.
- [ ] 3.2 Add API endpoints to `ProductosController.cs`: `POST /{id}/recalcular-rop`, `POST /merma`, and `GET /alertas`.

## Phase 4: Verification & Test Execution

- [ ] 4.1 Execute full backend unit test suite (`dotnet test`) and verify 100% PASS rate.
- [ ] 4.2 Run TypeScript check (`npx tsc -b`) to ensure clean frontend build.
