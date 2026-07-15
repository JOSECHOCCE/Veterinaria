# Design: Rediseño del Listado de Clientes

## Technical Approach

Rediseñar la estructura de `ClientesDashboard.tsx` para seguir el diseño Bento del prototipo Stitch, utilizando tokens de color de Material 3 y tipografía `Quicksand`. 
Para resolver el problema visual de filas demasiado altas debido a múltiples mascotas, limitaremos el renderizado a las primeras 2 mascotas y crearemos un tooltip interactivo para el excedente.

## Architecture Decisions

### Decision: Limitar visualización de mascotas y Tooltip en Hover

| Opción | Tradeoff | Decisión |
|---|---|---|
| Envolver en múltiples líneas (Actual) | Causa que la fila se expanda verticalmente y desalinea la tabla. | Rechazado |
| Scroll horizontal en celda | Scrollbars nativos afean el diseño Bento y entorpecen la lectura rápida. | Rechazado |
| Límite de 2 + Tooltip en Hover | Mantiene la altura de fila uniforme y permite consultar el excedente fácilmente en hover. | **Elegido** |

**Rationale**: Al limitar a 2 mascotas visibles (`mascotas.slice(0, 2)`), la altura de fila permanece uniforme. Un tooltip con posición absoluta (`absolute hidden group-hover/tooltip:block`) permite visualizar el listado completo sin alterar el flujo visual del documento.

## Data Flow

```
ClientesService.getClientes() ──→ ClientesDashboard.tsx (State) 
                                         │
                                         ├─→ Render Table Row
                                         │     ├─→ Get Initials & color category
                                         │     ├─→ slice(0, 2) to render badges
                                         │     └─→ slice(2) render tooltip on hover
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/Frontend/src/views/Clientes/ClientesDashboard.tsx` | Modify | Reestructurar UI a Bento y añadir lógica de Tooltip de mascotas. |

## Interfaces / Contracts

```typescript
// Estructura de tooltip inline para CSS puro
interface PetTooltipProps {
  mascotasExcedentes: Array<{ nombre: string; especie: string }>;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Tipo de renderizado de la tabla | TypeScript compiler y build de Vite |
| Manual | Comportamiento del tooltip en hover y límite de mascotas | Pruebas visuales locales en navegador (15.6") |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No migration required.

## Open Questions

None.
