# Design: Sprint 6 — Caja, Pagos, Idempotencia y Concurrencia en Stock

## Technical Approach

Introduce a dedicated `OrdenCobro` aggregate to decouple consultation completion from cashier payment processing. When a consultation completes, an `OrdenCobro` record is automatically populated with line items (`DetalleOrdenCobro`).

Cashier payment processing will accept mixed payment splits and an `Idempotency-Key`. Stock deductions for internal prescribed medications occur atomically during payment inside an EF Core transaction (`IDbContextTransaction`) with row locking/pessimistic verification, writing movements directly to `MovimientoInventario` (Kardex). Yape/Plin payments support a `PendienteVerificacion` state for delayed admin verification.

## Architecture Decisions

| Decision | Choice | Alternatives Considered | Rationale |
|----------|--------|-------------------------|-----------|
| **Billing Abstraction** | Dedicated `OrdenCobro` domain aggregate | Direct `Cita` payment mutation | Decouples clinical consultation flow from cashier processing. Allows multiple items (consultation + prescription + procedures). |
| **Concurrency & Stock** | EF Core `IDbContextTransaction` with explicit row check | Optimistic Concurrency Token (`[Timestamp]`) | Row lock / atomic transaction guarantees immediate failure/wait on overselling during checkout under high cashier concurrency. |
| **Idempotency** | Database unique constraint on `Pago.ClaveIdempotencia` | Redis distributed lock | Uses existing relational database infrastructure without introducing external cache dependencies. |
| **Mixed Payment Store** | Structured `DesgloseMetodos` JSON field on `Pago` + `Pago.MetodoPago = "Mixto"` | Separate `PagoMetodo` child table | Minimizes table joins while preserving full audit trail and query flexibility for daily closing reports. |

## Data Flow

```
[HistorialClinicoService.CompletarConsultaAsync]
       │
       ▼
 [OrdenCobro (Pendiente)] ──→ [Caja / PagosController]
                                      │
                         [ProcesarPagoMixtoAsync]
                                      │
                       ┌──────────────┴──────────────┐
                       ▼                             ▼
       [Check ClaveIdempotencia]     [EF Core Transaction + Row Lock]
                       │                             │
                       ▼                             ▼
        [If Duplicate: Return Cached]   [Deduct Producto.Stock + Kardex]
                                                     │
                                                     ▼
                                        [Save Pago & Update Orden]
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/Backend/Veterinaria.Domain/Entities/OrdenCobro.cs` | Create | Aggregate root for pending/completed billing orders |
| `src/Backend/Veterinaria.Domain/Entities/DetalleOrdenCobro.cs` | Create | Line item entity for billing orders |
| `src/Backend/Veterinaria.Domain/Entities/Pago.cs` | Modify | Add `OrdenCobroId`, `EstadoVerificacion`, `ClaveIdempotencia`, `CajeroId`, `DesgloseMetodos` |
| `src/Backend/Veterinaria.Infrastructure/Data/DbContext.cs` | Modify | Map `OrdenesCobro` and `DetallesOrdenCobro` DbSets and EF Core relations |
| `src/Backend/Veterinaria.Application/Services/PagoService.cs` | Modify | Implement `CrearOrdenCobroAsync`, `ProcesarPagoMixtoAsync`, `VerificarPagoYapePlinAsync`, `GetCierreCajaDiarioAsync` |
| `src/Backend/Veterinaria.Application/Services/HistorialClinicoService.cs` | Modify | Call `CrearOrdenCobroAsync` upon finishing consultation |
| `src/Backend/Veterinaria.Web/Controllers/PagosController.cs` | Modify | Expose `/api/pagos/ordenes-cobro`, `/api/pagos/cobrar-mixto`, `/api/pagos/yape-plin-pendientes`, `/api/pagos/cierre-caja` |
| `src/Backend/Veterinaria.Tests/PagoServiceTests.cs` | Modify | Add unit tests for atomic checkout, idempotency, mixed payments, and daily closure |

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `ProcesarPagoMixtoAsync` split payment calculation | xUnit + Moq mock DbContext |
| Unit | Atomic stock deduction & Kardex entry | xUnit in-memory EF Core transaction test |
| Unit | `ClaveIdempotencia` duplicate rejection | Verify exception/error return on repeated key |
| Unit | Yape/Plin verification status transition | Test `PendienteVerificacion` -> `Verificado` |
| Unit | `GetCierreCajaDiarioAsync` grouping | Verify revenue sums grouped by method & cashier |
