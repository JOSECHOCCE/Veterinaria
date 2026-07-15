# Proposal: Rediseño de Ficha de Cliente 360° (Iteración 3)

## Intent

Rediseñar la vista de detalle de cliente (`FichaClienteDetalle.tsx`) para alinearla con el diseño visual del prototipo Stitch "ficha_del_cliente_vetcarepro_360_view". La pantalla debe proveer un resumen completo e interactivo del cliente (datos de contacto, mascotas asociadas, historial de citas y balance financiero) optimizado para pantallas de laptop y escritorio.

## Scope

### In Scope
- Rediseñar el layout de `FichaClienteDetalle.tsx` dividiéndolo en tarjetas Bento (Bento Grid).
- Adaptar la tarjeta de Identidad del Cliente con avatar (o iniciales dinámicas) y detalles de contacto (Teléfono, DNI, Email, Fecha de alta).
- Adaptar la tarjeta de Resumen Financiero mostrando "Total Gastado" e "Importe Pendiente" con avisos de morosidad si aplica.
- Mostrar la tarjeta de Mascotas Asociadas en formato de grid compacto con redirección directa.
- Mostrar el historial de Citas en un formato de línea de tiempo simplificada con estados de cita formateados.
- Aplicar el padding de cabecera optimizado (`md:pt-4 md:px-10 md:pb-10`).

### Out of Scope
- Funcionalidad de agendar cita o ver facturas (se redireccionará a las vistas correspondientes).
- Modificaciones a los endpoints de la API.

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- None

## Approach

- Maquetar el Bento Grid usando CSS Grid (`grid-cols-1 lg:grid-cols-3` para la sección superior, y `grid-cols-1 lg:grid-cols-2` para la inferior).
- Incorporar transiciones dinámicas al hacer hover sobre los ítems de mascotas (`hover:bg-surface-soft`).
- Sincronizar el estado activo/inactivo del cliente conectando el botón de acción con la función `handleToggleActivo`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/Frontend/src/views/Clientes/FichaClienteDetalle.tsx` | Modified | Reestructuración de la vista completa y estilos. |

## Risks

None.

## Rollback Plan

- Ejecutar `git restore src/Frontend/src/views/Clientes/FichaClienteDetalle.tsx` para restablecer la vista anterior.

## Success Criteria

- [ ] La compilación con `npm run build` es exitosa.
- [ ] La interfaz se asemeja al prototipo Stitch de Ficha de Cliente 360° en diseño, espaciado y estructura.
- [ ] La interactividad para activar/inactivar al propietario y la carga dinámica de mascotas funcionan correctamente.
