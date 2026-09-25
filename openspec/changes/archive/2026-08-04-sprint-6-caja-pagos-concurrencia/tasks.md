# Tasks: Sprint 6 — Caja, Pagos, Idempotencia y Concurrencia en Stock

## Phase 1: Infrastructure & Domain Entities

- [x] 1.1 Create `OrdenCobro.cs` and `DetalleOrdenCobro.cs` domain entities in `Veterinaria.Domain/Entities/`.
- [x] 1.2 Update `Pago.cs` entity with `OrdenCobroId`, `EstadoVerificacion`, `ClaveIdempotencia`, `CajeroId`, and `DesgloseMetodos`.
- [x] 1.3 Map `OrdenesCobro` and `DetallesOrdenCobro` DbSets and relations in `Veterinaria.Infrastructure/Data/DbContext.cs`.

## Phase 2: DTOs & Service Contracts

- [x] 2.1 Create DTOs (`ProcesarPagoMixtoDto.cs`, `DetallePagoMetodoDto.cs`, `CierreCajaDto.cs`, `OrdenCobroDto.cs`) in `Veterinaria.Application/DTOs/`.
- [x] 2.2 Extend `IPagoService.cs` with contracts for billing order generation, mixed payment processing, Yape/Plin verification, and daily cash closing.

## Phase 3: Core Business Logic (Strict TDD: RED → GREEN → REFACTOR)

- [x] 3.1 **TDD RED (failing tests first)**: Write unit tests in `PagoServiceTests.cs` covering:
  - `CrearOrdenCobroDesdeConsultaAsync` (auto-generation upon consultation completion)
  - `ProcesarPagoMixtoAsync` (mixed payment calculation & sub-total rejection)
  - `ProcesarPagoMixtoAsync` (atomic stock deduction & Kardex entry)
  - `ProcesarPagoMixtoAsync` (idempotency key duplicate rejection)
  - `CambiarEstadoVerificacionPagoAsync` (Yape/Plin verification workflow)
  - `GetCierreCajaDiarioAsync` (daily cash closing report calculation)
  - Run `dotnet test` and verify failure.
- [x] 3.2 **TDD GREEN (implementation)**: Implement methods in `PagoService.cs` using EF Core `IDbContextTransaction` and atomic updates.
- [x] 3.3 Trigger automatic `OrdenCobro` creation inside `HistorialClinicoService.CompletarConsultaAsync`.
- [x] 3.4 **TDD REFACTOR**: Optimize LINQ queries, clean up code, and verify all tests pass (`dotnet test`).

## Phase 4: API Controllers & Endpoints

- [x] 4.1 Update `PagosController.cs` to expose endpoints:
  - `GET /api/pagos/ordenes-cobro`
  - `POST /api/pagos/cobrar-mixto`
  - `GET /api/pagos/yape-plin-pendientes`
  - `PUT /api/pagos/{id}/verificacion`
  - `GET /api/pagos/cierre-caja`
- [x] 4.2 Execute `dotnet test` to confirm 100% passing test suite.
