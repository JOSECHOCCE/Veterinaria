# Proposal: Sprint 6 — Caja, Pagos, Idempotencia y Concurrencia en Stock

## Intent

Implement a real-world cash management and payment system (Caja y Pagos) for VetCare Pro. This change introduces automatic billing order generation (`OrdenCobro`) when clinical consultations complete, mixed payment processing, atomic EF Core stock deduction with row locking on checkout, idempotency key enforcement, Yape/Plin manual voucher verification workflow, and cashier-based daily closing reports.

## Scope

### In Scope
- Automatic `OrdenCobro` aggregate generation upon medical consultation completion (`HU-010`, `RF-018`).
- Mixed payment processing (Cash + Card + Yape/Plin split in a single transaction) (`HU-011`, `RF-020`).
- Atomic EF Core transaction with row locking for stock deduction & Kardex entry at checkout (`HU-012`, `RF-021`, `RNF-023`).
- Idempotency key protection (`Idempotency-Key`) for payment and POS operations (`RF-021b`, `RNF-024`).
- Yape/Plin voucher registration with `PendienteVerificacion` status & Admin verification panel (`HU-034`, `HU-035`, `HU-036`, `RF-020a`, `RF-020b`).
- Daily cash closing report (`CierreCaja`) grouped by payment method and cashier (`HU-037`, `RF-020d`, `RF-020e`).

### Out of Scope
- Dynamic QR payment gateway integration with bank webhooks (Niubiz/Izipay) — deferred to post-MVP.
- Multi-branch cash register synchronization (Multi-tenant POS).

## Capabilities

### New Capabilities
- `caja-pagos-concurrencia`: Comprehensive billing order lifecycle, mixed payments, atomic stock deduction, idempotency validation, Yape/Plin verification, and daily cash closing.

### Modified Capabilities
- None

## Approach

1. **`OrdenCobro` Aggregate**: Automatically create `OrdenCobro` and `DetalleOrdenCobro` records upon consultation completion.
2. **Atomic Transaction & Concurrencia**: Wrap stock reduction inside `IDbContextTransaction` using EF Core pessimistic/atomic updates on `Producto.Stock` before committing payment.
3. **Idempotency & Yape/Plin Verification**: Implement `Idempotency-Key` tracking and add `EstadoVerificacion` ("Confirmado", "PendienteVerificacion", "Rechazado") to `Pago`.
4. **Daily Closing Report**: Add `GetCierreCajaDiarioAsync` query returning sales totals grouped by payment method and cashier user ID.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `Veterinaria.Domain/Entities/OrdenCobro.cs` | New | Domain aggregate for billing orders |
| `Veterinaria.Domain/Entities/DetalleOrdenCobro.cs` | New | Line items for billing orders |
| `Veterinaria.Domain/Entities/Pago.cs` | Modified | Adds `EstadoVerificacion`, `ClaveIdempotencia`, `CajeroId` |
| `Veterinaria.Application/Services/PagoService.cs` | Modified | Implements atomic checkout, mixed payments, idempotency, closure |
| `Veterinaria.Application/Services/HistorialClinicoService.cs` | Modified | Triggers automatic `OrdenCobro` generation at consultation end |
| `Veterinaria.Web/Controllers/PagosController.cs` | Modified | Exposes endpoints for checkout, verification, and cash closure |

## Success Criteria

- [x] Automatic `OrdenCobro` generated upon completing a consultation.
- [x] Mixed payment (e.g. S/. 50 Cash + S/. 30 Yape) recorded successfully.
- [x] Stock deducted atomically inside DB transaction with Kardex record.
- [x] Duplicate request with same `Idempotency-Key` rejected safely.
- [x] Yape/Plin payment with `PendienteVerificacion` transitions to `Verificado`/`Rechazado` by Admin.
- [x] Daily cash closing report returns exact totals by payment method and cashier.
