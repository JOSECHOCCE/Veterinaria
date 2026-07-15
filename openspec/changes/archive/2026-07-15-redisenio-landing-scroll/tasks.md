# Tasks: Habilitar Scroll en la Landing Page Pública

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~10 lines |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: stacked-to-main
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Habilitar scroll global en index.css | PR 1 | N/A (CSS change) | Cargar landing page en navegador | Revertir index.css |

## Phase 1: Core CSS Changes

- [x] 1.1 Modificar `src/Frontend/src/index.css` eliminando `overflow: hidden !important;` de `html, body` (alrededor de la línea 300).
- [x] 1.2 Modificar `src/Frontend/src/index.css` para que `html, body` use `min-height: 100%` en lugar de `height: 100%` para acomodar el flujo natural de scroll.

## Phase 2: Layout Verification

- [x] 2.1 Verificar que `src/Frontend/src/components/Layout/Layout.tsx` contenga la clase `overflow-hidden` y `h-screen` en su contenedor principal.
- [x] 2.2 Verificar que `src/Frontend/src/components/Layout/ClientLayout.tsx` contenga la clase `overflow-hidden` y `h-screen` en su contenedor principal.

## Phase 3: Manual Verification

- [x] 3.1 Ejecutar `npm run build` en la carpeta `src/Frontend` para validar que compile sin errores.
- [x] 3.2 Cargar las vistas públicas `/`, `/servicios`, `/equipo` y `/contacto` y verificar que el scroll vertical funcione de manera fluida.
- [x] 3.3 Validar que los dashboards administrativo y de cliente mantengan su scroll interno independiente.
