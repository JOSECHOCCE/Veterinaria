# Tasks — Auditoría Sprint 2

## Phase 1 — MUST (cierre + Kardex)
- [x] T1 Pago: cerrar cita a Completada al confirmar (PagoService L574-584) + test
- [x] T2 Pago pendiente: cerrar al verificar (CambiarEstadoVerificacionPagoAsync) + test
- [x] T3 Venta: guardar antes de Kardex + usuario real (VentaService L81-114)
- [x] T4 Venta cancelar: movimiento EntradaDevolucion (VentaService L119-142)

## Phase 2 — SHOULD (deferido a siguiente sprint)
- [ ] T5 Urgencias: auditoría + flag reasignación (CitaService L452, L521)
- [ ] T6 Caja: envolver en transacción atómica (PagoService L520-587)
- [ ] T7 Receta: ObservacionStock explícita (RecetaService L67-70)
- [ ] T8 Historial: decidir filtro Cerrado (HistorialClinicoService L37) y documentar

## Phase 3 — Verify
- [x] `dotnet test` suites Pago+Venta: 38/38 passed
- [x] verify-report.md + archive
