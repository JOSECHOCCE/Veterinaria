# Proposal: Rediseño de Mis Mascotas Portal (Iteración 6)

## Intent

Rediseñar la pantalla de "Mis Mascotas" del portal de clientes (`MisMascotas.tsx`) para alinearla con el diseño visual "mis_mascotas_portal_vetcarepro_15.6_optimized" del prototipo de Stitch. La pantalla debe presentar a las mascotas en un grid de tarjetas premium de formato circular centralizado con insignias de anillo de color, información compacta de edad y peso, y animación hover que desvele la acción de acceder al historial clínico.

## Scope

### In Scope
- Rediseñar el grid de mascotas en `MisMascotas.tsx`.
- Implementar la tarjeta interactiva de "Registrar Nueva Mascota" con diseño de borde discontinuo premium.
- Implementar las tarjetas de mascotas individuales con avatares circulares centrados, anillos de color decorativos y caja de detalles de Edad y Peso.
- Estilizar el modal de registro de mascota al estilo glassmorphism.

### Out of Scope
- Lógica de backend.

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- None

## Approach

- Diseñar las tarjetas con avatares circulares centrados y anillos dinámicos (`ring-primary-container` para perros y `ring-tertiary-container` para gatos).
- Incorporar transiciones en hover (`group-hover:opacity-100 transition-opacity`) para revelar el enlace al historial médico de la mascota.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/Frontend/src/views/PortalCliente/MisMascotas.tsx` | Modified | Reestructuración de la vista completa y estilos. |

## Risks

None.

## Rollback Plan

- Ejecutar `git restore src/Frontend/src/views/PortalCliente/MisMascotas.tsx` para restablecer el estado anterior.

## Success Criteria

- [ ] La compilación con `npm run build` es exitosa.
- [ ] La vista de Mis Mascotas se presenta con avatares circulares centrados y animaciones hover fluidas.
