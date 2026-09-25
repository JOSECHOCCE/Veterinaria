# Design: Sprint 7 — Botica / Venta Directa en Mostrador

## Technical Approach

Extend counter sales functionality (`Venta` entity and `VentaService`) to support over-the-counter (OTC) petshop sales while strictly enforcing automated blocking on controlled pharmaceuticals (`RequiereReceta == true`) unless a valid prescription (`RecetaId`) is linked.

Stock deductions will occur atomically during sale registration, and every counter sale item will generate an audit entry in `MovimientoInventario` with `TipoMovimiento = "SalidaVenta"` to keep Kardex inventory aligned.

## Architecture Decisions

| Decision | Choice | Alternatives Considered | Rationale |
|----------|--------|-------------------------|-----------|
| **Prescription Linkage** | Optional `RecetaId` on `Venta` entity | Separate `VentaReceta` table | Allows OTC petshop items (`RequiereReceta == false`) to sell freely while linking restricted drug purchases directly to a verified prescription. |
| **Validation Layer** | Service-layer validation in `VentaService.RegistrarVentaAsync` | DTO DataAnnotation validation | Complex domain rules matching product restrictions against prescription item lists belong in the Application service layer. |
| **Kardex Integration** | Synchronous `MovimientoInventario` insertion inside commit transaction | Async background message queue | Ensures 100% transactional consistency between product stock reduction and Kardex audit log. |

## Data Flow

```
[VentasController.Create(VentaDto)]
       │
       ▼
 [VentaService.RegistrarVentaAsync]
       │
       ├────► [For each item: Check Producto.RequiereReceta]
       │             │
       │             ├─ If True ──► [Validate Venta.RecetaId & Receta.Items]
       │             │                     │
       │             │                     ├─ If Invalid ──► Throw InvalidOperationException
       │             │                     └─ If Valid ────► Continue
       │             └─ If False ─► Continue
       │
       ├────► [Deduct Stock: producto.Stock -= detalle.Cantidad]
       ├────► [Add MovimientoInventario (TipoMovimiento = "SalidaVenta")]
       └────► [Save Venta & Commit Async]
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/Backend/Veterinaria.Domain/Entities/Venta.cs` | Modify | Add optional `RecetaId` foreign key and relation |
| `src/Backend/Veterinaria.Application/DTOs/VentaDto.cs` | Modify | Add `RecetaId` property to DTO |
| `src/Backend/Veterinaria.Application/Services/VentaService.cs` | Modify | Implement `RequiereReceta` verification check and Kardex `SalidaVenta` record |
| `src/Backend/Veterinaria.Web/Controllers/VentasController.cs` | Modify | Expose `/catalog-botica` endpoint and handle prescription validation errors |
| `src/Backend/Veterinaria.Tests/Application/VentaServiceTests.cs` | Modify | Add unit tests for direct sales success, prescription blocking, and Kardex audit |

## Interfaces / Contracts

```csharp
public class Venta
{
    public int Id { get; set; }
    public DateTime Fecha { get; set; } = DateTime.UtcNow;
    public decimal Total { get; set; }
    public string MetodoPago { get; set; } = "Efectivo";
    public int? ClienteId { get; set; }
    public virtual Usuario? Cliente { get; set; }
    public int? RecetaId { get; set; }
    [ForeignKey("RecetaId")]
    public virtual Receta? Receta { get; set; }
    public string Estado { get; set; } = "Completada";
    public virtual ICollection<DetalleVenta> Detalles { get; set; } = new List<DetalleVenta>();
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | OTC counter sale (`RequiereReceta == false`) | Verify success, stock deduction, Kardex `SalidaVenta` entry |
| Unit | Restricted drug sale (`RequiereReceta == true`) without `RecetaId` | Verify `InvalidOperationException` thrown with explicit message |
| Unit | Restricted drug sale with invalid/unmatching `RecetaId` | Verify exception thrown when drug not in prescription |
| Unit | Restricted drug sale with valid matching `RecetaId` | Verify success, stock deduction, Kardex `SalidaVenta` entry |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No database migration script required if using EF Core InMemory provider for unit tests; standard EF Core migration adds `RecetaId` nullable column to `Ventas` table.

## Open Questions

None — Design is fully aligned with specifications and real-world veterinary pharmacy rules.
