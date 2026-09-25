# Spec — flujo-clinico-should (delta)

## MUST (este change)
- Urgencia creada DEBE registrar auditoría de bypass con vet/fecha/motivo; si quedó sin consultorio DEBE registrar auditoría de reasignación y exponer `RequiereReasignacion=true` (derivado `EsUrgencia && ConsultorioId==null`).
- `ProcesarPagoMixtoAsync` y `RegistrarVentaAsync` DEBEN ejecutar stock+pago/venta+kardex dentro de transacción atómica (todo o nada) con rollback ante error; idempotencia DEBE re-chequearse dentro de la transacción.
- Receta con stock insuficiente DEBE anexar nota explícita `[Stock] ...` a `IndicacionesGenerales` en lugar de solo degradar el flag.
- Historial interno DEBE poder incluir borradores (`incluirBorradores=true`); portal cliente DEBE mostrar solo `Cerrado`.

## SHOULD (siguiente)
- Migración: unique filtered index `Pagos.ClaveIdempotencia` (WHERE NOT NULL).
- Migración: columnas `DetalleReceta.ObservacionStock` y `Cita.RequiereReasignacion` persistida + backfill.
- Test de concurrencia con provider relacional (TOCTOU real).
