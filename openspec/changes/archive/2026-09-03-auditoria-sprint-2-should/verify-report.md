# Verify Report — Auditoría Sprint 2 SHOULD (T5-T8)

## Cambios
- `Cita.cs` T5: `[NotMapped] RequiereReasignacion => EsUrgencia && ConsultorioId == null` (sin migración).
- `CitaService.cs` T5: `CreateCitaAsync` y `ReservaTemporalCitaAsync` registran auditoría post-commit "Urgencia bypass disponibilidad" y, si quedó sin consultorio, "Urgencia sin espacio - RequiereReasignacion".
- `IUnitOfWork` + `UnitOfWork` T6: `SoportaTransacciones` (`IsRelational`), `Begin/Commit/RollbackTransactionAsync` (no-op en InMemory).
- `PagoService.cs` T6: `ProcesarPagoMixtoAsync` envuelto en transacción; re-chequeo de `ClaveIdempotencia` dentro de la transacción; `DbUpdateException` por duplicado mapea a error de idempotencia; rollback en stock insuficiente y excepciones.
- `VentaService.cs` T6: `RegistrarVentaAsync` (venta + kardex, antes 2 commits sueltos) en una transacción con rollback.
- `RecetaService.cs` T7: al degradar `EsStockInterno→false` anexa `[Stock] <prod>: solicitada N, disponible M → compra externa` a `IndicacionesGenerales` (recorte a 1000, sin sobrescribir).
- `IHistorialClinicoService` + `HistorialClinicoService` T8: `GetHistorialesByMascotaIdAsync(mascotaId, incluirBorradores:false)`; decisión documentada (cliente solo cerrados, interno con flag).
- `PortalClienteService.cs` T8: `GetHistorialMascotaAsync` filtra `&& h.Cerrado` (antes exponía borradores).
- Tests: `PortalClienteServiceTests` seed con `Cerrado=true` + nuevo test `CuandoBorrador_NoDebeExponerlo`.

## Tests
- Foco Pago+Venta+Cita+Historial+Portal: **102/102 passed**.
- Suite unitaria completa: **298/298 passed** (0 errores).
- 1 fallo intermedio detectado y corregido: seed del test portal sin `Cerrado` (comportamiento esperado bajo nueva spec).

## Riesgos / siguiente
- Transacción es no-op en InMemory: aislamiento real solo en relacional.
- Sin constraint único `Pagos.ClaveIdempotencia` aún → TOCTOU entre transacciones paralelas persiste; migración recomendada (índice único filtrado WHERE NOT NULL).
- `IndicacionesGenerales` recorta a 1000 chars si hay muchas notas de stock.
