# Tasks: Rediseño de Portal Público (Landing & Equipo)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~600 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (Global theme and Header) -> PR 2 (LandingPage) -> PR 3 (EquipoPublic) |
| Delivery strategy | exception-ok |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Estilos globales y Header | PR 1 | npm run build | Visualizar Header | Revert index.css y PublicHeader.tsx |
| 2 | Rediseño de LandingPage.tsx | PR 2 | npm run build | Visitar `/` | Revert LandingPage.tsx |
| 3 | Rediseño de EquipoPublic.tsx | PR 3 | npm run build | Visitar `/equipo` | Revert EquipoPublic.tsx |

## Phase 1: Foundation (Theme & Header)

- [x] 1.1 Agregar la clase de utilidad `.ambient-shadow` en [index.css](file:///c:/Users/yaran/Documents/antigravity/Veterinaria/src/Frontend/src/index.css) y asegurar que las variables de acento como `--color-primary-container` estén presentes.
- [x] 1.2 Ajustar el diseño de [PublicHeader.tsx](file:///c:/Users/yaran/Documents/antigravity/Veterinaria/src/Frontend/src/views/PortalPublico/PublicHeader.tsx) integrando el nuevo logo, colores de botones redondeados con hover y efectos de backdrop blur.

## Phase 2: LandingPage Redesign

- [x] 2.1 Refactorizar el Hero en [LandingPage.tsx](file:///c:/Users/yaran/Documents/antigravity/Veterinaria/src/Frontend/src/views/PortalPublico/LandingPage.tsx) para usar el contenedor `bg-surface-container-low` con el badge "Clínica Veterinaria Premium" y el nuevo estilo de imagen.
- [x] 2.2 Reestructurar el área de Stats clave del landing para agruparlos en una sola tarjeta integrada con divisores verticales.
- [x] 2.3 Rediseñar el Bento Grid de especialidades (servicios) para usar las tarjetas `bg-surface-container-lowest` con bordes `rounded-[16px]`, líneas inferiores en títulos y hover con elevación.
- [x] 2.4 Reemplazar la sección de CTA final con el bloque en fondo `bg-primary` y efectos de orbes difuminados de fondo en degradado.

## Phase 3: EquipoPublic Redesign

- [x] 3.1 Rediseñar el Bento Grid responsivo de especialistas en [EquipoPublic.tsx](file:///c:/Users/yaran/Documents/antigravity/Veterinaria/src/Frontend/src/views/PortalPublico/EquipoPublic.tsx) para mostrar a los veterinarios activos usando la tarjeta del prototipo (badge de especialidad arriba, cita célebre en cursiva).
- [x] 3.2 Formatear la sección inferior de Recruitment con la tarjeta `bg-surface-container-low` y el botón redondeado estilo Stitch.

## Phase 4: Verification

- [x] 4.1 Validar que la compilación de frontend compila sin errores utilizando `npm run build`.
- [x] 4.2 Probar de manera interactiva la navegación entre Inicio y Equipo, verificando la responsividad móvil.
