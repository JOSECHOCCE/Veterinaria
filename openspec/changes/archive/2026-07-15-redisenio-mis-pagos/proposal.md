# Proposal: Rediseño de Mis Pagos Portal (Iteración 8)

## Intent

Rediseñar la pantalla de "Mis Facturas / Pagos" del portal de clientes (`MisPagos.tsx`) para alinearla con el diseño visual "mis_pagos_portal_vetcarepro_15.6_optimized" del prototipo de Stitch. Se optimizará el Bento Grid superior de balances (Gasto Total, Saldo Pendiente, Método de Pago) y la tabla de transacciones responsivas del historial.

## Scope

### In Scope
- Rediseñar el Bento Grid superior con las 3 tarjetas de balance (Invertido, Pendiente, Método de Pago).
- Rediseñar el listado de "Pagos Pendientes" con tablas simplificadas y acciones de pago directas.
- Rediseñar la sección de "Historial de Pagos" mediante filas de transacciones con avatares conceptuales de iconos y descarga de PDF.
- Estilizar el modal flotante de pago con tarjeta con glassmorphism M3.

### Out of Scope
- Lógica de backend.

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- None

## Approach

- Usar un grid bento para el resumen de gastos y de saldos pendientes.
- Implementar filas de transacciones responsivas (colapsando a etiquetas en móviles) para unificar la visualización del historial de facturas.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/Frontend/src/views/PortalCliente/MisPagos.tsx` | Modified | Reestructuración de la vista de listado de pagos y cobros. |

## Risks

None.

## Rollback Plan

- Ejecutar `git restore src/Frontend/src/views/PortalCliente/MisPagos.tsx` para restablecer el diseño previo.

## Success Criteria

- [ ] La compilación con `npm run build` es exitosa.
- [ ] Las tarjetas Bento superiores de balance y el listado de transacciones se muestran correctamente y alineadas al prototipo M3.
