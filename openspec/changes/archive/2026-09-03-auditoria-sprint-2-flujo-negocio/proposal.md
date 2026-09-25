# Proposal — Auditoría Sprint 2 Flujo Negocio

## Problema
El flujo Citas → Triage → SOAP → Receta → Cobro funciona pero tiene 5 brechas contra RF-005..RF-023 que causan citas sin cerrar, Kardex descuadrado y riesgo de doble-reserva en urgencias y doble-cobro por reintento.

## Solución
Serie de correcciones mínimas, con tests, sin cambiar UI:

1. **MUST — Cierre de cita al pagar (H2):** en `ProcesarPagoMixtoAsync`, al pagar orden con `CitaId`, setear `cita.Estado = "Completada"` además de `EstadoPago=Pagado`. Incluir cuando pago queda `PendienteVerificacion`? No — solo al Confirmado. Registrar auditoría.
2. **MUST — Kardex venta mostrador (H4):** guardar venta primero para tener Id, usar `usuarioOperador` real, crear movimiento `EntradaDevolucion` al cancelar.
3. **SHOULD — Urgencias auditadas (H1):** mantener bypass pero exigir `motivo` + auditoría + marcar `ConsultorioId = null` con flag `RequiereReasignacion`. No bloquear.
4. **SHOULD — Endurecer concurrencia (H3):** envolver descuento en transacción (`IUnitOfWork` + `BeginTransactionAsync` si existe, sino `TransactionScope`), más constraint único sugerido para `ClaveIdempotencia` (migración en diseño).
5. **SHOULD — Receta explícita (H5):** no silenciar falta de stock; retornar `EsStockInterno=false` + campo `ObservacionStock` visible, y aclarar filtro `Cerrado` en historial (documentar decisión).

## Fuera de alcance
- Pasarela Yape/Plin QR/webhook (RF-020c fase 2).
- Multi-sede, hospitalización, facturación electrónica avanzada.
- Rediseño UI.

## Riesgos
- Cambiar `cita.Estado` puede afectar reportes que filtran por `EstadoPago`. Mitigación: actualizar ambos y verificar `ReportesController`.
