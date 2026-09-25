# Proposal — Auditoría Sprint 2 SHOULD (T5-T8)

## Problema
Los 4 SHOULD dejan trazabilidad y atomicidad incompletas: urgencias sin auditoría, caja sin transacción explícita, receta que silencia falta de stock, e historial con filtro invertido entre interno y portal.

## Solución (sin migración)
1. **T5 — Urgencias auditadas:** en `CreateCitaAsync`/`ReservaTemporalCitaAsync`, tras commit, si `EsUrgencia` registrar auditoría "Urgencia bypass disponibilidad" y si `ConsultorioId==null` registrar "Urgencia sin espacio - RequiereReasignacion". Agregar `Cita.RequiereReasignacion` como `[NotMapped]` (`EsUrgencia && ConsultorioId==null`).
2. **T6 — Caja atómica:** agregar a `IUnitOfWork` `BeginTransactionAsync/CommitTransactionAsync/RollbackTransactionAsync` (no-op en provider no relacional). Envolver `ProcesarPagoMixtoAsync` y `RegistrarVentaAsync` (venta+kardex) en transacción con rollback ante error. Re-chequear idempotencia dentro de la transacción. Documentar constraint único `ClaveIdempotencia` como migración recomendada siguiente.
3. **T7 — Receta explícita:** al degradar `EsStockInterno→false`, acumular nota `[Stock] <producto>: solicitada N, disponible M → compra externa` y anexarla a `Receta.IndicacionesGenerales` sin sobrescribir.
4. **T8 — Historial:** `GetHistorialesByMascotaIdAsync(mascotaId, incluirBorradores:false)` — por defecto solo cerrados (seguro para cliente); interno pasa `true`. `PortalClienteService` filtra `&& h.Cerrado`. Documentar decisión.

## Fuera de alcance
- Migraciones EF (unique index idempotencia, columna ObservacionStock, columna RequiereReasignacion).
- Yape/Plin webhook, multi-sede, facturación electrónica.
- Cambios UI.

## Riesgos
- Transacción no-op en InMemory: tests cubren lógica, no aislamiento real. Mitigación: documentado + migración única sugerida.
- `IndicacionesGenerales` truncado a 1000 chars: se recorta nota con prioridad a lo existente.
