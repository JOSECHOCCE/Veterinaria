# Design: Rediseño de Mis Citas Portal

## Technical Approach

La pantalla de "Mis Citas" se reestructurará en base a un Bento Grid con tres secciones principales:
1. **Destacado de Próxima Cita (Bento Hero)**:
   * Si el cliente tiene citas futuras programadas, se mostrará un banner superior con degradado suave (`from-primary-container/10 to-transparent`), la foto de la mascota a consultar, el nombre del servicio, la fecha, hora y un acceso directo a la gestión.
2. **Filtros e Historial Clínico (Bento List)**:
   * Un panel que contendrá pestañas interactivas de filtrado rápido ("Todas", "Próximas", "Pasadas") y una barra de búsqueda conceptual.
3. **Estructura Responsiva de Datos**:
   * En escritorio: Una tabla elegante con bordes suaves que detalla fecha/hora, mascota (con mini-icono), servicio, estado (badges estilizados) y botones de acción contextuales en hover.
   * En móviles: Tarjetas independientes con espaciado óptimo, cabeceras con badge de estado y botones de acción extendidos en el pie.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/Frontend/src/views/PortalCliente/MisCitas.tsx` | Modify | Reemplazar el layout y aplicar el diseño M3 premium. |

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Manual | Comportamiento Responsivo y Hover | Validar en resoluciones de escritorio y móviles la correcta alineación de la tabla, los filtros de citas y la correcta apertura del modal de cancelación. |
| Build | Compilación de Vite | Validar la compilación estática. |
