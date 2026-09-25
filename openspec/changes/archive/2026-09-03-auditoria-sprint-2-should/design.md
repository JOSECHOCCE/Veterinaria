# Design — Auditoría Sprint 2 SHOULD T5-T8

## Decisiones
- **T5:** auditoría post-commit (tiene Id final) en `CitaService.CreateCitaAsync` y `ReservaTemporalCitaAsync`. `RequiereReasignacion` como `[NotMapped]` en `Cita` para no migrar. `ValidarYConfigurarCitaAsync` no cambia lógica de bypass, solo mantiene `ConsultorioId=null` cuando no hay espacio.
- **T6:** `IUnitOfWork` suma `Task BeginTransactionAsync()`, `Task CommitTransactionAsync()`, `Task RollbackTransactionAsync()` + `bool SoportaTransacciones { get; }` (`Database.IsRelational()`). `UnitOfWork` guarda `IDbContextTransaction?` privado. Servicios: `begin → try { trabajo + CommitAsync (+ segundo CommitAsync en Venta) → commitTx } catch { rollback; throw/return error }`. Pago re-chequea `ClaveIdempotencia` tras begin. `DbUpdateException` por duplicado futuro se mapea a error de idempotencia.
- **T7:** en `RecetaService.CrearRecetaAsync`, lista `avisosStock`; si hay, `receta.IndicacionesGenerales = AppendIndicacion(existente, string.Join(" | ", avisos))` recortado a 1000.
- **T8:** firma ampliada con default `bool incluirBorradores = false` (no rompe callers/tests). Portal agrega `&& h.Cerrado`.

## Alternativas descartadas
- Nuevas columnas + migración ahora: aumenta riesgo con repo sucio (~150 cambios); se difiere con spec global documentando columnas futuras.
- `TransactionScope`: problemas con async/InMemory y ambient transactions en tests; se usa transacción EF nativa.
- Sobrescribir `IndicacionesGenerales`: se anexa para no perder indicación médica.

## Archivos
- `Domain/Entities/Cita.cs` (NotMapped RequiereReasignacion)
- `Domain/Contracts/IUnitOfWork.cs` + `Infrastructure/Repositories/UnitOfWork.cs` (transacciones)
- `Application/Services/CitaService.cs` (T5 auditoría post-commit)
- `Application/Services/PagoService.cs` (T6)
- `Application/Services/VentaService.cs` (T6)
- `Application/Services/RecetaService.cs` (T7)
- `Application/Services/HistorialClinicoService.cs` + `Interfaces/IHistorialClinicoService.cs` + `Application/Services/PortalClienteService.cs` (T8)
