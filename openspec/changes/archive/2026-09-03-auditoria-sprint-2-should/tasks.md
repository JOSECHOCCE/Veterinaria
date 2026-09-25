# Tasks — Auditoría Sprint 2 SHOULD

## Phase 1 — SHOULD (T5-T8)
- [x] T5 Urgencias: `[NotMapped] RequiereReasignacion` en `Cita` + auditoría post-commit bypass/sin-espacio
- [x] T6 Caja: transacciones en `IUnitOfWork`/`UnitOfWork` + envolver `PagoService` y `VentaService` + re-check idempotencia
- [x] T7 Receta: nota `[Stock]` explícita anexada a `IndicacionesGenerales`
- [x] T8 Historial: `incluirBorradores` param + filtro `Cerrado` en portal + documentar

## Phase 2 — Verify
- [x] `dotnet test` suite completa: 298/298 passed (foco Pago+Venta+Cita+Historial+Portal: 102/102)
- [x] verify-report.md + spec global delta + archive
