# Proposal: Sprint 5 — Inventario Clínico, Punto de Reorden Dinámico (ROP) y Registro de Mermas

## Intent
Provide clinic inventory managers with automated inventory replenishment controls by calculating dynamic Reorder Points (ROP), tracking expiration dates, flagging low stock, and providing auditability for stock loss/waste (mermas) through a Kardex system.

## Scope

### In Scope
- **Dynamic ROP Algorithm (`HU-030`, `RF-065`)**: Calculate $ROP = \text{ConsumoMedioDiario} \times \text{LeadTimeDias} + \text{StockSeguridad}$ using past 30 days of sales & prescriptions.
- **Supplier Lead Time & Safety Stock Configuration (`HU-031`, `RF-064`)**: Add `LeadTimeDias` and `StockSeguridad` to `Producto`.
- **Low Stock & Expiration Alerts (`HU-032`, `HU-015`, `RF-067`)**: Generate alert feeds for items where `Stock <= ROP` or `FechaVencimiento <= 30` days.
- **Manual Minimum Stock Fallback (`HU-033`)**: Fallback to `StockMinimo` when historical sales data is < 7 days old.
- **Waste / Shrinkage Kardex (`HU-038`, `RF-066`)**: Create `MovimientoInventario` table to log waste reasons (Vencido, Dañado, Pérdida), sales, and manual adjustments.

### Out of Scope
- Automated purchase order generation to external suppliers via email/EDI (deferred to procurement sprint).
- Multi-warehouse inventory transfers across different physical locations.

## Capabilities

### New Capabilities
- `inventario-reorden`: Automated calculation of dynamic Reorder Point (ROP), expiration alerts, and Kardex movement logging.

### Modified Capabilities
- None

## Approach
1. Enhance `Producto` entity with `LeadTimeDias` (int), `StockSeguridad` (int), `FechaVencimiento` (DateTime?).
2. Create `MovimientoInventario` entity with fields (`ProductoId`, `TipoMovimiento`, `Cantidad`, `Motivo`, `UsuarioId`, `FechaRegistro`).
3. Add `CalcularRopDinamicoAsync(int productoId)` and `RegistrarMermaAsync(...)` methods to `ProductoService`.
4. Create API endpoints: `POST /api/Productos/{id}/recalcular-rop`, `POST /api/Productos/merma`, and `GET /api/Productos/alertas`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/Backend/Veterinaria.Domain/Entities/Producto.cs` | Modified | Add `LeadTimeDias`, `StockSeguridad`, `FechaVencimiento` |
| `src/Backend/Veterinaria.Domain/Entities/MovimientoInventario.cs` | New | Create Kardex movement entity |
| `src/Backend/Veterinaria.Infrastructure/Persistence/VeterinariaDbContext.cs` | Modified | Add `MovimientosInventario` DbSet |
| `src/Backend/Veterinaria.Application/Services/ProductoService.cs` | Modified | Add ROP & Merma logic |
| `src/Backend/Veterinaria.Web/Controllers/ProductosController.cs` | Modified | Add endpoints for ROP, Mermas, and Alerts |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| New products with 0 sales cause 0 ROP calculation | Medium | Fallback to `StockMinimo` if past 30-day consumption is 0 |
| Stock discrepancy during concurrent waste registration | Low | Use EF Core transaction with balance validation |

## Rollback Plan
Revert EF Core migration `Sprint5_Inventario_ROP_Kardex` and restore previous `ProductoService.cs`.

## Dependencies
- Existing `Venta`, `DetalleVenta`, `Receta`, and `DetalleReceta` records for historical consumption calculation.

## Success Criteria
- [ ] **SC-1**: Dynamic ROP correctly computes based on past 30 days of sales/prescriptions.
- [ ] **SC-2**: Products with `Stock <= ROP` or `FechaVencimiento <= 30` days appear in low-stock alert feed.
- [ ] **SC-3**: Shrinkage/waste logging creates immutable Kardex entries and decrements stock.
- [ ] **SC-4**: All unit tests pass (`dotnet test`) and TypeScript build compiles clean (`npx tsc -b`).
