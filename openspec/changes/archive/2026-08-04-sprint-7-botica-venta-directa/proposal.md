# Proposal: Sprint 7 — Botica / Venta Directa en Mostrador

## Intent

Implement a direct counter sales and prescription control system (`botica-venta-directa`) for VetCare Pro. This feature enables receptionists and cashiers to sell over-the-counter petshop products and non-restricted veterinary supplies without a medical consultation (`HU-013`, `RF-016`), while enforcing strict automated blocking on controlled pharmaceuticals (`RequiereReceta == true`) unless a valid medical prescription is attached (`HU-014`, `RF-017`). All counter sales automatically update stock and log Kardex inventory movements (`RNF-020`).

## Scope

### In Scope
- Over-the-counter direct sales for unrestricted products (petshop, food, accessories, OTC hygiene/flea items) (`HU-013`, `RF-016`).
- Hard automated blocking when attempting to sell restricted pharmaceuticals (`RequiereReceta == true`) without linking a valid, active prescription (`HU-014`, `RF-017`).
- Support optional `RecetaId` linking on `Venta` entity and DTOs.
- Automatic atomic stock deduction and Kardex entry (`MovimientoInventario` with `TipoMovimiento = "SalidaVenta"`) upon sale completion.
- API endpoints in `VentasController` for counter checkout and botica catalog search.

### Out of Scope
- Online e-commerce payment gateway integration.
- Controlled substance government report export (SENASA/DIGEMID PDF format) — deferred to future compliance release.

## Capabilities

### New Capabilities
- `botica-venta-directa`: Over-the-counter sales processing with automated prescription validation, stock deduction, and Kardex audit integration.

### Modified Capabilities
- None

## Approach

1. **Entity & DTO Extension**: Add optional `RecetaId` foreign key and navigation to `Venta.cs` and `VentaDto.cs`.
2. **Prescription Restriction Validation**: In `VentaService.RegistrarVentaAsync`, iterate through line items. If `producto.RequiereReceta == true`:
   - Validate `Venta.RecetaId.HasValue`.
   - Fetch `Receta` with `Items`. Verify `Receta` is active, unexpired, and contains the required prescribed drug.
   - If missing or invalid, throw `InvalidOperationException($"El producto '{producto.Nombre}' requiere una receta médica válida para su venta.")`.
3. **Atomic Stock & Kardex**: Update `producto.Stock -= detalle.Cantidad` and log `MovimientoInventario` with `TipoMovimiento = "SalidaVenta"`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `Veterinaria.Domain/Entities/Venta.cs` | Modified | Adds optional `RecetaId` foreign key and relation |
| `Veterinaria.Application/DTOs/VentaDto.cs` | Modified | Adds `RecetaId` field |
| `Veterinaria.Application/Services/VentaService.cs` | Modified | Implements prescription check & Kardex `SalidaVenta` logging |
| `Veterinaria.Web/Controllers/VentasController.cs` | Modified | Exposes counter sales endpoints with error response handling |
| `Veterinaria.Tests/Application/VentaServiceTests.cs` | Modified | Unit tests for OTC sales success, prescription blocking, and Kardex |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Counter checkout blocked due to customer misplacing prescription code | Med | Provide catalog search and prescription lookup by client DNI/pet name in counter UI |
| Concurrency overselling on popular OTC items | Low | Retain atomic EF Core stock update with stock availability check before commit |

## Rollback Plan

Revert `VentaService.cs` and `VentasController.cs` changes to remove prescription validation, drop `RecetaId` column from `Ventas` table, and fallback to legacy sales flow.

## Dependencies

- Existing `Producto`, `Venta`, `DetalleVenta`, `Receta`, `DetalleReceta`, `MovimientoInventario`, and `Usuario` domain entities.

## Success Criteria

- [ ] Direct counter sale of OTC items succeeds and deducts stock with Kardex record.
- [ ] Direct counter sale of restricted item (`RequiereReceta == true`) without `RecetaId` fails with clear error message.
- [ ] Direct counter sale of restricted item with valid `RecetaId` succeeds.
- [ ] Unit test suite executes 100% GREEN.
