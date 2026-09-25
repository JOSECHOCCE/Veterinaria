# Archive Report: Sprint 5 — Inventario Clínico, Punto de Reorden Dinámico (ROP) y Registro de Mermas

## Sprint Details
- **Sprint Name**: `sprint-5-inventario-reorden`
- **Archive Date**: 2026-08-03
- **Status**: **Completed & Archived**

## Summary of Accomplishments
1. **Punto de Reorden Dinámico ROP (`HU-030`, `RF-065`)**: Implemented dynamic ROP calculation algorithm ($ROP = \text{ConsumoMedioDiario} \times \text{LeadTimeDias} + \text{StockSeguridad}$) based on the past 30 days of sales and prescription consumption.
2. **Parámetros de Proveedor y Stock de Seguridad (`HU-031`, `RF-064`)**: Extended `Producto` entity and DTO with `LeadTimeDias`, `StockSeguridad`, and `FechaVencimiento`.
3. **Alertas de Reorden y Vencimiento (`HU-032`, `HU-015`, `RF-067`)**: Added API endpoint `GET /api/Productos/alertas` flagging products with `Stock <= ROP` or `FechaVencimiento <= 30` days.
4. **Fallback de Stock Mínimo (`HU-033`)**: Guaranteed safe reorder threshold for new products without 30-day sales history by falling back to `StockMinimo`.
5. **Auditoría de Kardex y Registro de Mermas (`HU-038`, `RF-066`)**: Created `MovimientoInventario` entity and `POST /api/Productos/merma` endpoint for logging waste/shrinkage (damaged, expired, lost) with user audit trail.

## Verification Summary
- **Backend Unit Tests**: 281/281 passing (100%), including 4 TDD unit tests in `ProductoServiceTests.cs`.
- **Frontend TypeScript Build**: 0 errors
- **Capability Spec**: Preserved permanently at `openspec/specs/inventario-reorden/spec.md`
