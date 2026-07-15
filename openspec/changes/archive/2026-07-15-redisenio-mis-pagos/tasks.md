# Tasks: Rediseño de Mis Pagos Portal

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~250-300 lines |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Rediseñar vista de Mis Pagos | Single PR | npm run build | npm run dev | src/Frontend/src/views/PortalCliente/MisPagos.tsx |

## Phase 1: Bento Grid Summary Cards

- [x] 1.1 Diseñar la tarjeta de Gasto Total con tendencia y avatar de billetera.
- [x] 1.2 Diseñar la tarjeta de Saldo Pendiente adaptativa.
- [x] 1.3 Diseñar la tarjeta de Método de Pago Principal.

## Phase 2: Pending Bills and Transaction History

- [x] 2.1 Diseñar la tabla de "Pagos Pendientes" con botones de pago rápido.
- [x] 2.2 Diseñar la sección de "Historial de Transacciones" con iconos de servicio conceptuales y botón de descarga de PDF.

## Phase 3: Payment Dialog Styling

- [x] 3.1 Estilizar el modal flotante de pago con tarjeta en formato glassmorphic.

## Phase 4: Verification

- [x] 4.1 Ejecutar `npm run build` en el frontend y validar que compile sin errores.
- [x] 4.2 Probar el flujo de pasarela conceptual de pago y descarga.
