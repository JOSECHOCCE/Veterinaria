# Proposal: Corrección de Bloqueo de Scroll en el Portal del Cliente

## Intent

Corregir el problema que impide hacer scroll en las vistas del rol de clientes (`ClientLayout.tsx`). Dado que `index.css` establece de manera global `overflow: hidden !important` en `html` y `body`, la navegación del portal del cliente se encuentra bloqueada. Se habilitará el scroll local dentro de la sección de contenido principal del layout del cliente.

## Scope

### In Scope
- Modificar `ClientLayout.tsx` para establecer la altura de la vista completa a `h-screen` con `overflow-hidden`.
- Modificar el contenedor `<main>` en `ClientLayout.tsx` para permitir el scroll vertical de manera interna (`overflow-y-auto`).

### Out of Scope
- Modificaciones globales a `index.css`.

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- None

## Approach

- Reemplazar `min-h-screen` por `h-screen overflow-hidden` en el contenedor raíz de `ClientLayout.tsx`.
- Añadir `overflow-y-auto` al componente `<main>` que encapsula `<Outlet />`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/Frontend/src/components/Layout/ClientLayout.tsx` | Modified | Ajustar clases de scroll y contenedores flex. |

## Risks

None.

## Rollback Plan

- Ejecutar `git restore src/Frontend/src/components/Layout/ClientLayout.tsx`.

## Success Criteria

- [ ] La compilación con `npm run build` es exitosa.
- [ ] Las vistas bajo el rol de cliente (por ejemplo, el dashboard del cliente `/cliente/portal`) permiten hacer scroll vertical cuando el contenido supera el tamaño de la pantalla.
