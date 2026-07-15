# Tasks: Corrección de Bloqueo de Scroll en el Portal del Cliente

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 10-20 lines |
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
| 1 | Habilitar scroll en ClientLayout.tsx | Single PR | npm run build | npm run dev | src/Frontend/src/components/Layout/ClientLayout.tsx |

## Phase 1: Layout Containers

- [x] 1.1 Modificar el contenedor raíz de `ClientLayout.tsx` de `min-h-screen` a `h-screen overflow-hidden`.
- [x] 1.2 Agregar `overflow-y-auto` a la etiqueta `<main>` que envuelve a `<Outlet />`.

## Phase 2: Verification

- [x] 2.1 Ejecutar `npm run build` en el frontend y validar que compile sin errores.
- [x] 2.2 Probar manualmente que las vistas del portal del cliente hagan scroll correctamente.
