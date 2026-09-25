# Exploración — Auditoría Sprint 2 Flujo Negocio (Citas → Triage → SOAP → Receta → Cobro)

## Alcance
- RF-005 a RF-010 (Citas, disponibilidad, doble-reserva)
- RF-011 a RF-013 (Check-in, Triage, cola tiempo real)
- RF-014 a RF-018 (SOAP, historial, receta, presupuesto, orden cobro)
- RF-019 a RF-023 (Caja, pago mixto, stock atómico, comprobante, cita Completada/Pagada)
- RF-064 a RF-066 (Botica venta directa con receta)

## Archivos revisados
- `src/Backend/Veterinaria.Application/Services/CitaService.cs` (779 líneas, Reglas 1,2,3,14)
- `src/Backend/Veterinaria.Application/Services/TriageService.cs` (122 líneas)
- `src/Backend/Veterinaria.Application/Services/HistorialClinicoService.cs` (280 líneas)
- `src/Backend/Veterinaria.Application/Services/PagoService.cs` (722 líneas, ProcesarPagoMixtoAsync L491-597)
- `src/Backend/Veterinaria.Application/Services/VentaService.cs` (171 líneas)
- `src/Backend/Veterinaria.Application/Services/RecetaService.cs` (91 líneas, CrearRecetaAsync L40-80)

## Hallazgos (5)

### H1 — Urgencias bypasean disponibilidad (Riesgo: doble-reserva) — RF-005/RF-010
- `CitaService.cs:452-457` y `521-523`: si `cita.EsUrgencia`, no valida `VeterinarioDisponibleAsync` ni consultorio.
- Requerimiento base dice urgencia "puede sobreescribir", pero no hay auditoría ni límite ni resolución de conflicto.
- Riesgo: dos urgencias mismo vet/consultorio/horario = solape silencioso.

### H2 — Pago mixto no cierra cita como Completada/Pagada — RF-023
- `PagoService.cs:574-584`: al pagar orden, actualiza `MontoTotal/MontoPagado/EstadoPago=Pagado` pero nunca `cita.Estado`.
- RF-023 exige cambiar cita a "Completada/Pagada" tras el pago. Flujo queda en EnAtencion eternamente → cola y reportes inconsistentes.

### H3 — Stock sin transacción atómica real + idempotencia con TOCTOU — RF-021/RF-021b
- `PagoService.cs:521-543`: loop lee `GetByIdAsync`, resta, `Update`, agrega movimiento. Sin `TransactionScope` / `ExecuteInTransaction`, sin row-version.
- Check idempotencia `L496-503` + insert `L570` sin constraint único en DB → doble clic / reintento paralelo puede duplicar.
- `VentaService.cs:81-114`: mismo patrón sin transacción y sin `ClaveIdempotencia`.
- Existe `ConcurrencyStockPaymentTests.cs` (4 tests), pero cubre solo camino feliz, no TOCTOU.

### H4 — VentaService: Kardex y auditoría incompletos — RF-026/RF-032
- `VentaService.cs:93`: `Motivo = $"Venta en mostrador #{venta.Id}"` con `venta.Id == 0` (aún no guardada) → Kardex huérfano.
- `RegistradoPor = "Caja Mostrador"` hardcodeado, no usuario real.
- `CancelarVentaAsync L119-142`: devuelve stock pero no crea movimiento Kardex de reverso → descuadre.

### H5 — Receta oculta falta de stock + historial filtra cerrados — RF-016/RF-015
- `RecetaService.cs:67-70`: si `EsStockInterno && prod.Stock < cantidad`, silenciosamente marca `EsStockInterno=false` (compra externa). No avisa a caja/clínica, rompe trazabilidad receta→stock.
- `HistorialClinicoService.cs:37`: `Where(... && h.Cerrado)` con comentario de duda. Si RF-015 pide historial previo completo, borradores del mismo vet quedarían ocultos.

## Siguiente
Propose: corregir H2+H4 (cierre cita, Kardex) como MUST, H1+H3+H5 como SHOULD con tests. Ver `proposal.md`.
