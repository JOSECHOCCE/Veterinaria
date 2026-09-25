# Design: Sprint 5 — Inventario Clínico, Punto de Reorden Dinámico (ROP) y Registro de Mermas

## Technical Approach
Implement dynamic Reorder Point (ROP) calculation, low-stock/expiration alerts, and Kardex movement logging by:
1. Extending `Producto` entity with reorder parameters (`LeadTimeDias`, `StockSeguridad`, `FechaVencimiento`).
2. Creating `MovimientoInventario` entity to record immutable inventory transactions (`Entrada`, `SalidaVenta`, `SalidaReceta`, `MermaVencido`, `MermaDañado`, `Ajuste`).
3. Adding ROP calculation and waste registration methods to `ProductoService`.

---

## Architecture Decisions

| Decision | Choice | Alternatives Considered | Rationale |
|----------|--------|-------------------------|-----------|
| **ROP Calculation Engine** | In-memory 30-day aggregation | Pre-computed cron job table | Aggregating past 30 days of `DetalleVenta` + `DetalleReceta` is fast in SQL and provides real-time accuracy. |
| **Kardex Movement Log** | Immutable append-only `MovimientoInventario` table | Mutating `Producto.Stock` without audit log | Auditability for mermas/waste is legally and operationally required for clinic management. |
| **New Product Fallback** | Fallback to `StockMinimo` if sales history < 7 days | ROP = 0 | Setting ROP = 0 for new products would suppress reorder alerts, risking stockouts. |

---

## Data Flow

```
   [ Inventory Manager / Sales / Receta ]
                     │
                     ▼
           [ ProductoService ]
          /         │         \
         /          │          \
        ▼           ▼           ▼
   Recalculate   Register     Fetch Low Stock /
     ROP        Waste (Merma)  Expiration Alerts
        │           │           │
        ▼           ▼           ▼
  [ Update ROP ] [ Log Kardex ] [ Return Alert DTOs ]
```

---

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/Backend/Veterinaria.Domain/Entities/Producto.cs` | Modify | Add `LeadTimeDias`, `StockSeguridad`, `FechaVencimiento` |
| `src/Backend/Veterinaria.Domain/Entities/MovimientoInventario.cs` | Create | New Kardex movement audit entity |
| `src/Backend/Veterinaria.Infrastructure/Persistence/VeterinariaDbContext.cs` | Modify | Add `MovimientosInventario` DbSet |
| `src/Backend/Veterinaria.Domain/Contracts/IUnitOfWork.cs` | Modify | Add `MovimientosInventario` repository |
| `src/Backend/Veterinaria.Infrastructure/Repositories/UnitOfWork.cs` | Modify | Instantiate `MovimientosInventario` repository |
| `src/Backend/Veterinaria.Application/Interfaces/IProductoService.cs` | Modify | Add ROP, Merma, and Alert method signatures |
| `src/Backend/Veterinaria.Application/Services/ProductoService.cs` | Modify | Implement ROP calculation, waste logging & alert queries |
| `src/Backend/Veterinaria.Web/Controllers/ProductosController.cs` | Modify | Add endpoints `POST /recalcular-rop`, `POST /merma`, `GET /alertas` |
| `src/Backend/Veterinaria.Tests/Application/ProductoServiceTests.cs` | Create/Modify | Unit tests for ROP calculation, mermas, and fallback logic |

---

## Interfaces / Contracts

```csharp
public class RegistrarMermaDto
{
    public int ProductoId { get; set; }
    public int Cantidad { get; set; }
    public string Motivo { get; set; } = default!; // "Vencido", "Dañado", "Perdida"
    public string? Observaciones { get; set; }
}

public class ProductoAlertaDto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = default!;
    public int Stock { get; set; }
    public int RopCalculado { get; set; }
    public DateTime? FechaVencimiento { get; set; }
    public string TipoAlerta { get; set; } = default!; // "StockBajo", "PorVencer", "Ambos"
}
```

---

## Testing Strategy (TDD Planned)

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Dynamic ROP formula calculation | TDD (Red -> Green -> Refactor) using MSTest & InMemory DB |
| Unit | Manual minimum stock fallback for new products | Test ROP computation when sales history is 0 |
| Unit | Kardex waste registration & stock decrement | Verify `MovimientoInventario` creation and stock balance update |
| Integration | API Controller endpoints for Mermas & Alerts | Endpoint invocation verification |

---

## Threat Matrix
`N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.`

---

## Migration / Rollout
EF Core Migration `Sprint5_Inventario_ROP_Kardex` will create `MovimientosInventario` table and add ROP columns to `Productos`. No data loss.

---

## Open Questions
- None
