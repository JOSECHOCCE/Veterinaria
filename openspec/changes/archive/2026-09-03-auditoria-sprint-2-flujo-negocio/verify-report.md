# Verify Report — Auditoría Sprint 2 MUST (T1-T4)

## Cambios
- `PagoService.cs` T1: al pagar orden confirmada, `cita.Estado=Completada` (RF-023). Si queda PendienteVerificacion, no se cierra.
- `PagoService.cs` T2: `CambiarEstadoVerificacionPagoAsync` cierra cita al pasar a Confirmado/Verificado.
- `IVentaService.cs` + `VentaService.cs` T3: `RegistrarVentaAsync(venta, registradoPor)` guarda venta primero (Id final) y luego Kardex con usuario real.
- `VentaService.cs` T4: `CancelarVentaAsync(id, registradoPor)` crea movimiento `EntradaDevolucion`.
- `VentasController.cs`: pasa `User.Identity.Name` a servicio.

## Tests
- `dotnet test Veterinaria.Tests.Unitarias.csproj --filter PagoServiceTests|VentaServiceTests`: **38/38 passed** (3s).
- No se rompieron asserts existentes (incl. Kardex SalidaVenta, idempotencia, cierre caja).
- Cobertura nueva pendiente: test explícito T1 confirmada vs pendiente, y T4 EntradaDevolucion (recomendado siguiente paso).

## Riesgos
- `EntradaDevolucion` es nuevo valor de TipoMovimiento; reportes que filtran por lista cerrada deben incluirlo.
- Doble Commit en Venta (venta + kardex) no es atómico total; fase SHOULD T6 debe envolver en transacción.
