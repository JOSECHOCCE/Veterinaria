# Design: Habilitar Scroll en la Landing Page Pública

## Technical Approach

El objetivo técnico es habilitar el scroll vertical nativo en todo el portal público (`/`, `/servicios`, `/equipo`, `/contacto`) mediante la remoción de la propiedad `overflow: hidden !important;` en el selector CSS global `html, body`. Como el panel administrativo (`Layout.tsx`) y el portal del cliente (`ClientLayout.tsx`) manejan de forma aislada y explícita el scroll interno en sus respectivos contenedores principales usando `h-screen overflow-hidden`, el scroll global del viewport no afectará negativamente el comportamiento de estas aplicaciones internas.

## Architecture Decisions

### Decision: Remover la regla restrictiva de overflow en el CSS global

**Choice**: Eliminar `overflow: hidden !important` de `html, body` en `index.css`.
**Alternatives considered**:
- Agregar clases o efectos de React (`useEffect`) en las páginas públicas para cambiar el estilo del `document.body` de forma dinámica (ej: `document.body.style.overflow = 'auto'`). Se rechazó debido a que manipula imperativamente el DOM y añade acoplamiento innecesario en múltiples componentes.
**Rationale**: Mantener el comportamiento estándar y semántico del navegador. El scroll de página debe ser el comportamiento por defecto, y el bloqueo debe aplicarse de manera localizada en las aplicaciones de una sola página (SPAs) o dashboards que así lo requieran.

## Data Flow

No hay cambios en el flujo de datos. Es un cambio puramente de presentación y estilos visuales CSS.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/Frontend/src/index.css` | Modify | Remover la regla restrictiva de overflow en el selector `html, body` |

## Interfaces / Contracts

No se introducen nuevos contratos ni interfaces.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Manual | Scroll en Landing Page | Ingresar a la Landing Page pública en un navegador y verificar que se pueda hacer scroll vertical completo hasta el pie de página |
| Manual | Scroll en Servicios, Equipo y Contacto | Ingresar a `/servicios`, `/equipo` y `/contacto` y verificar el scroll vertical |
| Manual | Integridad del Panel de Admin y Cliente | Iniciar sesión y validar que el panel administrativo y el portal del cliente retengan su scrollbar interno y no presenten desbordamiento doble |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No migration required.
