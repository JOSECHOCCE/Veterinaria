# Tasks: Rediseño del Listado de Clientes

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 150-200 lines |
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
| 1 | Rediseñar vista listado de clientes con tooltip | Single PR | npm run build | npm run dev | src/Frontend/src/views/Clientes/ClientesDashboard.tsx |

## Phase 1: Foundation

- [x] 1.1 Diseñar y estructurar la cabecera y el panel de filtros Bento en `ClientesDashboard.tsx`.
- [x] 1.2 Implementar iniciales dinámicas para avatares usando `getInitialsBg`.

## Phase 2: Core Table & Pets limit

- [x] 2.1 Limitar renderizado de mascotas a las primeras 2 pills (`mascotas.slice(0, 2)`).
- [x] 2.2 Crear pill de "+N" con un menú de tooltip posicionado de manera absoluta (`absolute hidden group-hover/tooltip:block`) para mostrar mascotas excedentes.
- [x] 2.3 Aplicar clases de hover en los botones de acciones de cada fila (`group-hover:opacity-100`).

## Phase 3: Verification

- [x] 3.1 Ejecutar `npm run build` en el frontend y validar que compile sin errores.
- [x] 3.2 Probar manualmente en local con Vite dev server la interactividad y apariencia visual del Tooltip.
