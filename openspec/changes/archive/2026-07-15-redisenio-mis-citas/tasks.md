# Tasks: Rediseño de Mis Citas Portal

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~200-250 lines |
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
| 1 | Rediseñar vista de Mis Citas | Single PR | npm run build | npm run dev | src/Frontend/src/views/PortalCliente/MisCitas.tsx |

## Phase 1: Bento Hero and Headers

- [x] 1.1 Diseñar el banner superior Bento Hero "Próxima Cita" filtrando la cita más cercana cronológicamente.
- [x] 1.2 Diseñar el panel de barra de búsqueda y pestañas de filtrado (Todas, Próximas, Pasadas).

## Phase 2: Responsive Appointment Lists

- [x] 2.1 Maquetar la tabla de escritorio (`hidden md:block`) con badges de estado detallados (Por Confirmar, Confirmada, Completada, Cancelada) y acciones hover.
- [x] 2.2 Maquetar las tarjetas móviles (`md:hidden`) con cabeceras de mascota y pie de acciones.

## Phase 3: Dialog / Modal Styling

- [x] 3.1 Rediseñar los modales de cancelación y éxito de cancelación al estilo glassmorphism.

## Phase 4: Verification

- [x] 4.1 Ejecutar `npm run build` en el frontend y validar que compile sin errores.
- [x] 4.2 Probar el flujo de cancelación y navegación en la pantalla.
