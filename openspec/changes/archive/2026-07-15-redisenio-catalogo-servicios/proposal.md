# Proposal: Rediseño de Catálogo de Servicios (Iteración 10)

## Intent

Rediseñar la pantalla de "Catálogo de Servicios" (`GestionServicios.tsx`) del panel de administración para adaptarla al diseño visual moderno en cuadrícula de tarjetas ("cat_logo_de_servicios_visual_vetcarepro_15.6_optimized") del prototipo de Stitch, reemplazando la tabla genérica por una galería responsiva premium.

## Scope

### In Scope
- Rediseñar el listado de servicios utilizando una rejilla responsiva de tarjetas Bento (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`).
- Cada tarjeta incluirá:
  * Imagen de cabecera temática según la categoría (Medicina, Cirugía, Estética, General).
  * Badge de la categoría flotando sobre la imagen.
  * Título, descripción simplificada y precio base formateado.
  * Menú contextual flotante (`more_vert`) para las opciones de Admin (Editar, Activar/Desactivar, Eliminar) o botones de acción directa en la tarjeta.
- Rediseñar la barra de herramientas de filtrado con categorías rápidas tipo pill (Todos, Medicina, Cirugía, Estética) y el buscador.
- Integrar animaciones suaves de entrada y hover en las tarjetas de servicios.

### Out of Scope
- Lógica de backend.

## Approach

- Mantener los estados de búsqueda, filtro e inactivación del componente React.
- Mapear las categorías de los servicios para asignarles automáticamente una imagen de cabecera temática de alta calidad desde Unsplash.
- Conservar los permisos de administración (`isAdmin`) para las acciones de edición, activación y eliminación.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/Frontend/src/views/Servicios/GestionServicios.tsx` | Modified | Cambiar la visualización tabular por una cuadrícula premium de tarjetas Bento. |

## Risks

None.

## Rollback Plan

- Ejecutar `git restore src/Frontend/src/views/Servicios/GestionServicios.tsx` para restablecer la vista tabular anterior.

## Success Criteria

- [ ] La compilación con `npm run build` es exitosa.
- [ ] Las tarjetas de servicios se renderizan correctamente con imágenes temáticas y badges correspondientes.
- [ ] Las acciones del menú contextual (editar, eliminar, activar/desactivar) funcionan como antes.
