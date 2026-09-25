# Design — Auditoría Sprint 2 MUST T1-T4

## Decisiones
- **T1/T2 cierre cita:** cambio mínimo en `PagoService`, sin migración. `Estado=Completada` solo cuando verificación es `Confirmado` (acepta `Verificado` legacy en T2 por compatibilidad con test existente). `EstadoPago=Pagado` se mantiene siempre al pagar orden (comportamiento previo).
- **T3 Kardex:** dos `CommitAsync` secuenciales (venta → movimientos) en lugar de uno solo, para tener `venta.Id` final. Firma ampliada con `registradoPor = "Caja Mostrador"` opcional para no romper tests ni controller. Controller pasa `User.Identity.Name`.
- **T4 reverso:** nuevo `TipoMovimiento="EntradaDevolucion"` (string libre, sin constraint en DB). Motivo incluye `venta.Id` y usuario.
- **No transacción distribuida** en este sprint (deferido a T6 SHOULD) para limitar riesgo; cada `CommitAsync` es atómico por sí mismo.

## Alternativas descartadas
- Transacción única con Id temporal / navegación EF: requería refactor de `IUnitOfWork` y `DbContext` tracking; se pospone a T6.
- Sobrescribir `EstadoPago` a Pendiente cuando hay verificación pendiente: rompería test `ProcesarPagoMixto_CuandoSumaCorrecta` y reportes de caja; se mantiene `Pagado`.

## Archivos
- `Application/Services/PagoService.cs` (T1 L574-584, T2 L613-631)
- `Application/Services/VentaService.cs` + `Interfaces/IVentaService.cs` (T3/T4)
- `Web/Controllers/VentasController.cs` (usuario real)
