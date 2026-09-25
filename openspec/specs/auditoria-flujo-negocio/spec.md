# Spec — flujo-clinico (delta)

## MUST
- Al confirmar pago de `OrdenCobro` con `CitaId`, el sistema DEBE setear `Cita.Estado="Completada"`, `EstadoPago="Pagado"`, `MontoPagado=MontoTotal`.
- Si pago queda `PendienteVerificacion`, NO debe cerrar cita; al confirmar verificación, DEBE cerrarla.
- Venta mostrador DEBE persistir `Venta` antes de crear movimientos Kardex, con `RegistradoPor=<usuario>` real y `Motivo` con Id final.
- Cancelación de venta DEBE crear movimiento Kardex inverso `EntradaDevolucion`.

## SHOULD
- Cita de urgencia que bypasea disponibilidad DEBE registrar auditoría con motivo y marcar `RequiereReasignacion` si no hubo consultorio libre.
- Descuento de stock en caja DEBE ser atómico (todo o nada).
- Receta con stock insuficiente DEBE exponer `ObservacionStock` en lugar de silenciar.

## SHOULD cumplido (2026-09-03, sin migración)
- Urgencia: auditoría post-commit "Urgencia bypass disponibilidad" + "Urgencia sin espacio - RequiereReasignacion"; `Cita.RequiereReasignacion` derivado `[NotMapped]` (`EsUrgencia && ConsultorioId==null`).
- Caja atómica: `IUnitOfWork` con transacciones explícitas (no-op en no relacional); `ProcesarPagoMixtoAsync` y `RegistrarVentaAsync` todo-o-nada con rollback; idempotencia re-chequeada en transacción. Pendiente: índice único filtrado `Pagos.ClaveIdempotencia`.
- Receta: nota `[Stock] <producto>: solicitada N, disponible M → compra externa` anexada a `IndicacionesGenerales` (max 1000).
- Historial: interno `GetHistorialesByMascotaIdAsync(mascotaId, incluirBorradores:false)`; portal cliente solo `Cerrado`.
