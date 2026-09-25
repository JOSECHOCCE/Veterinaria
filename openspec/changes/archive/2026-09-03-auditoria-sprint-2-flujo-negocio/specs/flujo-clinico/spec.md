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
