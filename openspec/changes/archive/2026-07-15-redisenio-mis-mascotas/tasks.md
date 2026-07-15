# Tasks: Rediseño de Mis Mascotas Portal

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~150-200 lines |
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
| 1 | Rediseñar vista de Mis Mascotas | Single PR | npm run build | npm run dev | src/Frontend/src/views/PortalCliente/MisMascotas.tsx |

## Phase 1: Grid and Cards Design

- [x] 1.1 Diseñar la tarjeta de registro rápido como primer elemento del grid.
- [x] 1.2 Diseñar la tarjeta de mascota individual con avatar centrado, anillo de especie y caja interna de edad/peso.
- [x] 1.3 Implementar el hover de revelado de enlace al historial clínico.

## Phase 2: Dialog / Modal Styling

- [x] 2.1 Estilizar el modal de registro rápido en formato M3 premium y degradado de fondo.

## Phase 3: Verification

- [x] 3.1 Ejecutar `npm run build` en el frontend y validar que compile sin errores.
- [x] 3.2 Probar la correcta redirección e interacción.
