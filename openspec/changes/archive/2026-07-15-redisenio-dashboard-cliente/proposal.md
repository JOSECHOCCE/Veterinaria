# Proposal: Rediseño de Dashboard del Cliente Portal (Iteración 5)

## Intent

Rediseñar la vista del dashboard principal del portal del cliente (`PortalCliente.tsx`) para alinearla con el diseño visual "dashboard_del_cliente_ultra_premium_vetcarepro" del prototipo de Stitch. El dashboard debe ser altamente estético, premium y centrado en la experiencia del propietario, incorporando el Hero Glass Panel, el Action Center de accesos rápidos, la sección de compañeros y la línea de tiempo de citas programadas con detalles del veterinario.

## Scope

### In Scope
- Rediseñar el layout de `PortalCliente.tsx` dividiéndolo en un grid principal de dos columnas (Izquierda: Hero, Companions, Action Center; Derecha: Schedule/Timeline de Citas).
- Implementar el "Hero Glass Panel" de bienvenida que integre un gradiente sutil y avatar del propietario.
- Implementar el "Action Center" con 4 tarjetas de acceso rápido (Nueva Cita, Mis Pagos, Historial Clínico, Identificaciones Digitales) con animaciones hover interactivas.
- Rediseñar la sección de "Mis Mascotas" con tarjetas de diseño premium con insignias de estado ("Al día", "Próxima Vacuna").
- Rediseñar la sección lateral de "Próximas Citas" mostrando el timeline e incorporando la tarjeta interna del veterinario asignado.

### Out of Scope
- Funcionalidad real de tracking de wearables.
- Modificaciones en los servicios del backend.

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- None

## Approach

- Usar `glass-panel` (fondo translúcido con desenfoque) para el Hero de bienvenida.
- Utilizar animaciones hover tridimensionales (`hover:-translate-y-1 hover:shadow-lg`) para las tarjetas de mascotas y Quick Actions.
- Renderizar la tarjeta del veterinario dentro del timeline de citas de manera dinámica extrayendo las iniciales del médico.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/Frontend/src/views/PortalCliente/PortalCliente.tsx` | Modified | Reestructuración de la vista completa y estilos. |

## Risks

None.

## Rollback Plan

- Ejecutar `git restore src/Frontend/src/views/PortalCliente/PortalCliente.tsx` para restablecer el estado anterior.

## Success Criteria

- [ ] La compilación con `npm run build` es exitosa.
- [ ] La vista del portal del cliente se presenta con diseño premium, efectos glassmorphism y comportamiento responsivo.
