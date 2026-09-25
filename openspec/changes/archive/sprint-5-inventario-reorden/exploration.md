# Exploration: Sprint 5 — Inventario Clínico, Punto de Reorden Dinámico (ROP) y Registro de Mermas

## 1. Current State Analysis
- **`Producto.cs`**: Currently contains basic fields (`Nombre`, `Precio`, `Stock`, `StockMinimo`, `Categoria`, `Activo`, `RequiereReceta`).
- **`ProductoService.cs`**: Has basic `GetProductosBajoStockAsync()` checking `Stock <= StockMinimo`.
- **Missing Elements**:
  1. No `LeadTimeDias` or `StockSeguridad` fields on `Producto`.
  2. No dynamic ROP calculation ($ROP = \text{ConsumoMedioDiario} \times \text{LeadTimeDias} + \text{StockSeguridad}$).
  3. No `MovimientoInventario` / `Kardex` table for tracking inventory movements (sales, prescriptions, mermas/waste, manual adjustments, purchase entries).
  4. No expiration date tracking (`FechaVencimiento` or batch/lote info).

---

## 2. Requirements Cross-Reference (RF + RNF + HU)

| ID | Source | Summary | Current Code Status | Action Required |
|---|---|---|---|---|
| **HU-030** | `05-historias-usuario.md` | Dynamic ROP Calculation ($ROP = Consumo \times LeadTime + StockSeguridad$) | Missing | Add ROP calculation service based on historical sales/prescriptions over 30 days |
| **HU-031** | `05-historias-usuario.md` | Supplier Lead Time configuration | Missing | Add `LeadTimeDias` and `StockSeguridad` fields to `Producto.cs` |
| **HU-032 / HU-015** | `05-historias-usuario.md` | Low stock & expiration alerts | Partial | Expand alert logic from `Stock <= StockMinimo` to `Stock <= ROP` and `FechaVencimiento <= 30` days |
| **HU-033** | `05-historias-usuario.md` | Manual minimum stock fallback for new products | Partial | Use `StockMinimo` as fallback ROP when historical sales data is insufficient (< 7 days) |
| **HU-038** | `05-historias-usuario.md` | Shrinkage / Waste log (Mermas: damaged, expired, lost) | Missing | Create `MovimientoInventario` (Kardex) entity + waste registration endpoint |
| **RF-064** | `03-requisitos-funcionales.md` | Product catalog with ROP fields | Partial | Update `Producto.cs` with `LeadTimeDias`, `StockSeguridad`, `FechaVencimiento` |
| **RF-065** | `03-requisitos-funcionales.md` | Dynamic ROP calculation algorithm | Missing | Implement `CalcularRopDinamicoAsync()` in `ProductoService` |
| **RF-066** | `03-requisitos-funcionales.md` | Kardex movements & waste registration | Missing | Create `MovimientoInventario` table with types (`Entrada`, `SalidaVenta`, `SalidaReceta`, `MermaVencido`, `MermaDañado`, `Ajuste`) |
| **RF-067** | `03-requisitos-funcionales.md` | Visual inventory alert indicators | Missing | Expose API endpoint `GET /api/Productos/alertas` for dashboard widgets |

---

## 3. Affected Areas
- **`src/Backend/Veterinaria.Domain/Entities/Producto.cs`**: Add ROP & expiration fields.
- **`src/Backend/Veterinaria.Domain/Entities/MovimientoInventario.cs`**: **New Entity** for Kardex.
- **`src/Backend/Veterinaria.Infrastructure/Persistence/VeterinariaDbContext.cs`**: Add `MovimientosInventario` DbSet.
- **`src/Backend/Veterinaria.Application/Services/ProductoService.cs`**: Implement dynamic ROP calculation, waste logging, and low-stock alerts.
- **`src/Backend/Veterinaria.Web/Controllers/ProductosController.cs`**: Add endpoints for ROP recalculation, waste registration (`POST /api/Productos/merma`), and alert feeds.

---

## 4. Architectural Approaches

### Approach 1: Dynamic ROP with Kardex Integration (Recommended)
- **Description**: Add `LeadTimeDias` and `StockSeguridad` to `Producto`. Calculate daily consumption rate from past 30 days of sales + prescriptions. Fallback to `StockMinimo` if no sales history exists. Every stock change writes a immutable `MovimientoInventario` record.
- **Pros**:
  - 100% compliant with real-world inventory management and audit standards.
  - Handles new products smoothly without breaking.
  - Complete audit trail of waste/shrinkage (Mermas).
- **Cons**: Requires EF Core migration and 1 new entity table.
- **Effort**: Medium

---

## 5. Recommendation & Risks
- **Recommendation**: Proceed with **Approach 1**.
- **Risks**:
  - Historical consumption calculation must handle products with zero past sales without division-by-zero errors.
  - Kardex entry must be transactionally committed alongside stock balance updates.

---

## 6. Ready for Proposal
**Yes** — Proceed to `sdd-propose` for Sprint 5.
