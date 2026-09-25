# Exploración — Auditoría Sprint 2 SHOULD (T5-T8)

## Alcance
Cerrar los 4 SHOULD deferidos del ciclo MUST (archive 2026-09-03):
- T5 Urgencias auditadas + flag reasignación (`CitaService.ValidarYConfigurarCitaAsync` L450-525)
- T6 Caja transacción atómica (`PagoService.ProcesarPagoMixtoAsync` L491-601, `VentaService.RegistrarVentaAsync` doble Commit)
- T7 Receta stock explícito (`RecetaService.CrearRecetaAsync` L65-70)
- T8 Historial filtro Cerrado (`HistorialClinicoService.GetHistorialesByMascotaIdAsync` L30-40, `PortalClienteService.GetHistorialMascotaAsync` L247-267)

## Hallazgos verificados
- T5: `if (!cita.EsUrgencia)` bypasea disponibilidad y consultorio sin auditoría; `ConsultorioId` queda null implícito, sin flag visible.
- T6: `PagoService` hace 1 `CommitAsync` final (atómico en SaveChanges) pero el check de idempotencia es previo y sin constraint único → TOCTOU. `VentaService` hace 2 `CommitAsync` secuenciales (venta → kardex) → ventana no atómica. `IUnitOfWork` no expone transacciones.
- T7: `item.EsStockInterno=false` silencioso; `DetalleReceta` sin campo observación; `Receta.IndicacionesGenerales` (1000 chars) libre para nota explícita sin migración.
- T8: interno filtra `&& h.Cerrado` (oculta borradores al propio vet), portal cliente NO filtra `Cerrado` (expone borradores) → lógica invertida.

## Restricciones
- Sin migraciones DB en este sprint (repo sucio, minimizar riesgo). Todo con columnas existentes + `[NotMapped]`.
- Tests InMemory deben seguir pasando (sin transacciones reales en provider no relacional).
