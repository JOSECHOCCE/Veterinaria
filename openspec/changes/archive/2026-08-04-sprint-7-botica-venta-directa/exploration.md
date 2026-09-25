# Exploration: Sprint 7 — Botica / Venta Directa en Mostrador

## Current State

In VetCare Pro, counter sales are registered through `VentasController` and `VentaService`. However:
1. `VentaService.RegistrarVentaAsync` does not check `producto.RequiereReceta`. Any restricted medication can be purchased without a prescription (`HU-014` violation).
2. Counter sales do not create Kardex entries (`MovimientoInventario`), causing inventory auditing discrepancies with Sprint 5 & 6.
3. Sales do not support linking an optional `RecetaId` when prescription drugs are present.

## Affected Areas

- `src/Backend/Veterinaria.Domain/Entities/Venta.cs` — Add optional `RecetaId` foreign key and navigation property.
- `src/Backend/Veterinaria.Domain/Entities/Producto.cs` — `RequiereReceta` bool property already exists (`Line 31`), needs to be evaluated during sale registration.
- `src/Backend/Veterinaria.Application/Services/VentaService.cs` — Add prescription verification check, Kardex `MovimientoInventario` logging, and stock deduction.
- `src/Backend/Veterinaria.Application/DTOs/VentaDto.cs` / `RegistrarVentaDto.cs` — Update DTOs with `RecetaId`.
- `src/Backend/Veterinaria.Web/Controllers/VentasController.cs` — Expose endpoint for counter sales with prescription validation and catalog search (`GET /api/ventas/catalog-botica`).
- `src/Backend/Veterinaria.Tests/Application/VentaServiceTests.cs` — Add unit tests for direct sales and prescription restriction enforcement.

## Approaches

### Option A: Strict Prescription Blocking & Kardex Audit (Recommended)
- Evaluate `producto.RequiereReceta` for every item in `Venta.Detalles`.
- If any item has `RequiereReceta == true`:
  - Verify `Venta.RecetaId` is supplied.
  - Fetch `Receta` with `Items` by `RecetaId`.
  - Validate that `Receta` is active, belongs to the client/pet, and contains the requested prescribed product with sufficient unused quantity.
  - If validation fails, abort transaction with error: `"El producto '{producto.Nombre}' requiere una receta médica válida para su venta."`.
- For all completed counter sales:
  - Deduct stock atomically.
  - Record `MovimientoInventario` with `TipoMovimiento = "SalidaVenta"`.

- **Pros:** 100% compliant with real-world veterinary pharmaceutical regulations (DIGEMID/SENASA), prevents illegal over-the-counter sales of controlled antibiotics/anesthetics, maintains Kardex audit integrity.
- **Cons:** Requires checking `Receta` details during sale registration.
- **Effort:** Medium.

### Option B: Soft Warning Flag without Hard Blocking
- Allow counter sale of restricted products with a visual warning prompt in UI.
- **Cons:** Violates `HU-014` and `RF-017` hard constraints, risks regulatory non-compliance in real clinic operations.
- **Effort:** Low.

## Recommendation

Select **Option A**. Implement hard blocking on prescription-only products (`RequiereReceta == true`) unless a valid `RecetaId` is supplied, and log Kardex entries for all counter sales.

## Matrix of Requirements & Traceability

| User Story | Functional Req | Non-Functional Req | Description | Implementation Target |
|---|---|---|---|---|
| `HU-013` | `RF-016` | `RNF-020` | Venta directa de productos de libre comercio en mostrador sin receta médica | `VentaService.RegistrarVentaAsync` |
| `HU-014` | `RF-017` | `RNF-024` | Bloqueo automático de venta directa si el producto requiere receta y no se adjunta receta válida | `VentaService.RegistrarVentaAsync` & `VentasController` |

## Real-World Veterinary Clinic Directives
1. **Productos de Libre Venta (Petshop/Higiene):** Alimentos, suplementos, champús, juguetes y antipulgas de venta libre se venden directamente en recepción sin receta.
2. **Medicamentos Restringidos (Antibióticos/Anestésicos/Especiales):** La venta de fármacos con `RequiereReceta == true` está estrictamente bloqueada a menos que el cliente presente o el sistema verifique una receta emitida por un veterinario colegiado.
3. **Kardex Unificado:** Toda salida por mostrador debe registrar un movimiento de inventario `SalidaVenta` para que el stock de botica coincida exactamente con el inventario físico.

## Risks
- **Risk:** Stale or expired prescriptions used for counter sales.
- **Mitigation:** Validate `Receta.FechaEmision` is within allowed timeframe (e.g., max 30 days old).

## Ready for Proposal
Yes — Ready to execute `sdd-propose`.
