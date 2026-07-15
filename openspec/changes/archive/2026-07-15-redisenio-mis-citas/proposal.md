# Proposal: Rediseño de Mis Citas Portal (Iteración 7)

## Intent

Rediseñar la pantalla de "Mis Citas" del portal de clientes (`MisCitas.tsx`) para alinearla con el diseño visual "mis_citas_portal_vetcarepro_15.6_optimized" del prototipo de Stitch. Se implementará un Bento Grid que destaca la próxima cita programada en la parte superior y presenta un listado de todas las citas mediante tablas responsivas estilizadas y filtros interactivos de estado (Todas, Próximas, Pasadas).

## Scope

### In Scope
- Implementar la tarjeta Bento destacada de "Próxima Cita" al inicio de la página.
- Agregar panel conceptual de búsqueda y filtros rápidos de citas.
- Rediseñar el listado tabular para pantallas de escritorio con badges de colores con puntos de estado de la cita.
- Rediseñar la vista móvil basada en tarjetas independientes con acciones rápidas de detalles y cancelación.
- Estilizar el modal de confirmación de cancelación y de éxito con glassmorphism y checkmark animado.

### Out of Scope
- Funcionalidad de backend o base de datos.

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- None

## Approach

- Ordenar cronológicamente las citas activas para extraer la más próxima como tarjeta destacada superior.
- Utilizar una tabla responsiva oculta en dispositivos móviles (`hidden md:block`) y tarjetas simplificadas para móviles (`md:hidden`).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/Frontend/src/views/PortalCliente/MisCitas.tsx` | Modified | Reestructuración de la vista de listado de citas y modales. |

## Risks

None.

## Rollback Plan

- Ejecutar `git restore src/Frontend/src/views/PortalCliente/MisCitas.tsx` para deshacer los cambios visuales.

## Success Criteria

- [ ] La compilación con `npm run build` es exitosa.
- [ ] La vista destacada superior de la próxima cita y la tabla responsiva se muestran correctamente y alineadas al prototipo M3.
