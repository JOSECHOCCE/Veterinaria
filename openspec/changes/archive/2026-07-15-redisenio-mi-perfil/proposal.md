# Proposal: Rediseño de Mi Perfil Portal (Iteración 9)

## Intent

Rediseñar la pantalla de "Mi Perfil" del portal de clientes (`MiPerfil.tsx`) para alinearla con el diseño visual "mi_perfil_portal_vetcarepro_15.6_optimized" del prototipo de Stitch. Se optimizará el grid de dos columnas (Información Personal en la izquierda y Seguridad / Estado en la derecha) utilizando los estándares M3 premium.

## Scope

### In Scope
- Rediseñar el contenedor principal en un layout de columnas responsivas (`lg:grid-cols-12 gap-8`).
- Columna izquierda (`lg:col-span-8`): Datos personales en modo lectura y formulario editable de contacto (Teléfono, Dirección), con avatar de foto de perfil.
- Columna derecha (`lg:col-span-4`): Formulario de cambio de contraseña e indicador gráfico de estado de verificación de la cuenta.
- Mejorar los inputs, avatares, alertas de éxito y error de estilo glassmorphism.

### Out of Scope
- Lógica de backend.

## Approach

- Usar la misma lógica de estados y llamadas a servicios existentes para garantizar que el formulario funcione perfectamente.
- Adaptar las clases Tailwind CSS de los inputs y botones a la estética moderna premium M3.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/Frontend/src/views/PortalCliente/MiPerfil.tsx` | Modified | Reestructuración visual de la vista del perfil de usuario del portal. |

## Risks

None.

## Rollback Plan

- Ejecutar `git restore src/Frontend/src/views/PortalCliente/MiPerfil.tsx` para restablecer el diseño anterior.

## Success Criteria

- [ ] La compilación con `npm run build` es exitosa.
- [ ] La pantalla de Perfil se muestra en dos columnas responsivas con el nuevo estilo.
