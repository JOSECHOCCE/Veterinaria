# Design: Rediseño de Catálogo de Servicios

## Technical Approach

La pantalla de "Catálogo de Servicios" se actualizará de un formato tabular a una vista de rejilla de tarjetas Bento responsiva:

1. **Barra de Búsqueda y Filtros Temáticos**:
   * Mantener el input de búsqueda debounced.
   * Agregar píldoras de filtro rápido por categoría (Ej. Todos, Medicina, Cirugía, Estética) que actualicen dinámicamente un estado de filtro.
2. **Rejilla de Tarjetas (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`)**:
   * **Imagen de Cabecera**: Se implementará un mapeador que asigne imágenes temáticas de Unsplash según las palabras clave del servicio:
     - Medicina/Consulta -> Imagen de revisión veterinaria con perrito/gatito.
     - Cirugía/Dental -> Quirófano o instrumental clínico.
     - Estética/Baño/Uñas -> Peluquería canina/spa.
     - Default -> Clínica moderna de mascotas.
   * **Categoría**: Badge flotante en la esquina superior derecha (`absolute top-4 right-4`).
   * **Detalles**: Título, descripción comercial con límite de líneas (`line-clamp-2`), y precio base destacado en color primario (`text-primary` y tamaño grande).
   * **Menú de Operaciones**: Menú de tres puntos (`more_vert`) flotante para administradores, posicionado discretamente en la tarjeta para no saturar el diseño.
   * **Efecto Hover**: Micro-animación de elevación en hover y degradado translúcido.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/Frontend/src/views/Servicios/GestionServicios.tsx` | Modify | Reemplazar la tabla por una cuadrícula responsiva de tarjetas con imágenes temáticas. |

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Manual | Ajuste responsivo y filtros | Probar la búsqueda y el filtro por categoría, y abrir el menú contextual en móvil y escritorio. |
| Build | Compilación de Vite | Validar la compilación estática. |
