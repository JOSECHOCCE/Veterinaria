# Design: Rediseño de Dashboard del Cliente Portal

## Technical Approach

Reestructurar `PortalCliente.tsx` para reflejar fielmente la composición visual del prototipo premium de Stitch.
- **Fondo de Página**: Añadir un degradado radial sutil en el fondo del layout.
- **Grid Principal**: Diseñar un layout `grid grid-cols-1 xl:grid-cols-12 gap-8` para alojar los módulos de compañeros, acciones y la barra lateral de citas.
- **Glass Panel**: Utilizar las clases `bg-white/70 backdrop-blur-md border border-white/50 shadow-sm` para generar el efecto glassmorphism en el Hero de bienvenida.
- **Acciones Rápidas**: Incorporar efectos de hover dinámicos y alternancia de colores de fondo (`bg-primary/10`, `bg-blue-50`, `bg-amber-50`, `bg-purple-50`) con iconos representativos.

## Architecture Decisions

### Decision: Layout Lateral para Citas

| Opción | Tradeoff | Decisión |
|---|---|---|
| Layout vertical lineal | Causa mucho scroll y desperdicia espacio a los costados en resoluciones HD. | Rechazado |
| Layout con Barra Lateral Pegajosa (`sticky`) | Mantiene las próximas citas siempre visibles en escritorio mientras se explora el catálogo de mascotas. | **Elegido** |

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/Frontend/src/views/PortalCliente/PortalCliente.tsx` | Modify | Rediseñar layout de dashboard del portal y añadir componentes interactivos. |

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Manual | Navegación e Interactividad | Comprobar que los accesos del Action Center y las tarjetas de mascotas redirijan a las rutas correspondientes. |
| Build | Compilación de Vite | Validar la compilación estática. |
