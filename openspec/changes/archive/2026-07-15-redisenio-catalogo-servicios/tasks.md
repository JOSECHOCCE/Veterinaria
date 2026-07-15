# Tasks: Rediseño de Catálogo de Servicios

## Review Workload Forecast

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Rediseñar vista de Catálogo de Servicios | Single PR | npm run build | npm run dev | src/Frontend/src/views/Servicios/GestionServicios.tsx |

## Phase 1: Search & Filter Toolbar

- [x] 1.1 Rediseñar el encabezado de página con el botón "Añadir Servicio".
- [x] 1.2 Diseñar el panel de búsqueda y botones rápidos de filtro por categoría (píldoras interactivas).

## Phase 2: Bento Grid Service Cards

- [x] 2.1 Crear el mapeador de imágenes temáticas basadas en categorías/servicios.
- [x] 2.2 Maquetar la tarjeta Bento individual (cabecera con imagen, badge de categoría, precio grande, y detalles de duración).
- [x] 2.3 Añadir micro-animaciones hover a las tarjetas.

## Phase 3: Action Buttons & Admin Context Menu

- [x] 3.1 Integrar el menú contextual `more_vert` para las acciones administrativas (Editar, Activar, Eliminar) dentro de cada tarjeta.

## Phase 4: Verification

- [x] 4.1 Ejecutar `npm run build` en el frontend y validar que compile sin errores.
- [x] 4.2 Probar los filtros por categoría y búsqueda, y el menú de acciones.
