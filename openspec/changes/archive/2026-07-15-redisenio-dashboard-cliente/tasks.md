# Tasks: Rediseño de Dashboard del Cliente Portal

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 250-300 lines |
| 400-line budget risk | Low |
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
| 1 | Rediseñar vista dashboard cliente con Bento, Glassmorphism y timeline | Single PR | npm run build | npm run dev | src/Frontend/src/views/PortalCliente/PortalCliente.tsx |

## Phase 1: Welcome Hero & Spacing

- [x] 1.1 Modificar la envoltura y añadir orbes/degradados radiales de fondo.
- [x] 1.2 Implementar el "Hero Glass Panel" de bienvenida con gradientes de fondo y avatar del propietario con estado de membresía.

## Phase 2: Companions & Action Center (Left Column)

- [x] 2.1 Maquetar la sección "Mis Mascotas" con tarjetas de diseño premium con insignias de estado ("Al día", "Próxima Vacuna").
- [x] 2.2 Maquetar el "Action Center" con 4 tarjetas de acceso rápido (Nueva Cita, Mis Pagos, Historial Clínico, Identificaciones Digitales).
- [x] 2.3 Estilizar y vincular la advertencia de vacunas pendientes o alertas críticas en el portal.

## Phase 3: Schedule & Timeline (Right Column)

- [x] 3.1 Maquetar la sección lateral "Calendario de Citas" mostrando el timeline vertical.
- [x] 3.2 Implementar la tarjeta interna del veterinario asignado y un panel de promoción de métricas de salud al pie de la columna.

## Phase 4: Verification

- [x] 4.1 Ejecutar `npm run build` en el frontend y validar que compile sin errores.
- [x] 4.2 Probar manualmente la navegación de los enlaces y la interactividad.
