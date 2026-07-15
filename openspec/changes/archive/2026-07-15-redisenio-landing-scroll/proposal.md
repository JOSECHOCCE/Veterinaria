# Proposal: Habilitar Scroll en la Landing Page Pública

## Intent

Resolver el error de bloqueo de scroll vertical en la Landing Page pública y otras vistas del portal público (`/`, `/servicios`, `/equipo`, `/contacto`). Esto permitirá a los usuarios no autenticados deslizar la página y explorar los contenidos promocionales y de contacto de la clínica.

## Scope

### In Scope
- Eliminar la propiedad limitante `overflow: hidden !important;` en la regla global `html, body` de `index.css`.
- Asegurar que los layouts de administración (`ProtectedLayout.tsx`, `ClientLayout.tsx`, etc.) sigan bloqueando el scroll del viewport global y manejen su scroll interno de forma correcta y controlada.

### Out of Scope
- Rediseñar el contenido visual o añadir nuevas secciones a las páginas públicas.
- Implementar nuevas vistas públicas.

## Capabilities

### New Capabilities
None

### Modified Capabilities
None

## Approach

1. Modificar `src/Frontend/src/index.css` para eliminar `overflow: hidden !important;` de `html, body`.
2. Verificar los layouts `ProtectedLayout.tsx` y `ClientLayout.tsx`. Si no lo tienen, agregar clases de control como `h-screen overflow-hidden` en sus contenedores principales para mantener la consistencia del scroll interno del panel y evitar scroll de página doble en la administración.
3. Comprobar la visualización local mediante la compilación y prueba de la interfaz.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/Frontend/src/index.css` | Modified | Eliminar regla limitante en `html, body` |
| `src/Frontend/src/components/Layout/ProtectedLayout.tsx` | Modified | Asegurar aislamiento del viewport con `overflow-hidden` si hace falta |
| `src/Frontend/src/components/Layout/ClientLayout.tsx` | Modified | Asegurar aislamiento del viewport con `overflow-hidden` si hace falta |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Desborde de scrollbar doble en paneles internos | Low | Verificar la jerarquía y aplicar `overflow-hidden` en las clases de envoltura de los layouts |

## Rollback Plan

Revertir los cambios en `index.css` y layouts correspondientes mediante Git (`git checkout -- <archivo>`).

## Dependencies

None

## Success Criteria

- [ ] Las páginas públicas (`/`, `/servicios`, `/equipo`, `/contacto`) permiten scroll vertical completo del navegador de forma nativa.
- [ ] Las vistas administrativas de administración y del portal del cliente mantienen su scroll interno sin distorsiones ni barras duplicadas.
