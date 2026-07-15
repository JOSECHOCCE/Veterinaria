# Proposal: Rediseño de Directorio de Clientes (Iteración 1)

## Intent

Rediseñar la vista principal del directorio de clientes (`ClientesDashboard.tsx`) utilizando el diseño visual Bento y los tokens de diseño de la clínica. Además, resolver el problema visual de desalineación en las filas cuando un propietario tiene múltiples mascotas (más de dos).

## Scope

### In Scope
- Rediseñar el encabezado, toolbar, filtros y tabla de `ClientesDashboard.tsx`.
- Implementar iniciales dinámicas para avatares con fondos de Material 3.
- Limitar la visualización de mascotas asociadas a un máximo de 2 pills.
- Mostrar una pill de "+N mascotas" para el excedente, con un tooltip emergente (al hacer hover) que liste todas las mascotas adicionales.
- Ocultar las acciones de fila y revelarlas dinámicamente con transiciones CSS al hacer hover sobre la fila (`group-hover:opacity-100`).

### Out of Scope
- Funcionalidad de creación, edición o detalle del cliente (se implementarán en las siguientes iteraciones).
- Modificaciones en los servicios del backend o la API de Axios.

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- None (este cambio es puramente una mejora de interfaz de usuario)

## Approach

- Usar Tailwind CSS v4 para aplicar la jerarquía visual del prototipo.
- Crear un componente de Tooltip en línea (CSS puramente estructurado o Framer Motion) para desplegar el listado completo de mascotas de forma limpia y responsiva.
- Utilizar la clase `group` de Tailwind para alternar la opacidad de los botones de acción por fila en hover.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/Frontend/src/views/Clientes/ClientesDashboard.tsx` | Modified | Rediseño de interfaz y lógica de visualización de mascotas. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Modificación accidental de lógica de filtrado de la API | Low | Mantener intacta la lógica de hooks y llamadas a `ClientesService` |
| Fallos de renderizado en Tooltips en vistas móviles | Low | El diseño es desktop-first y usaremos tooltips con posicionamiento absoluto relativo a la fila |

## Rollback Plan

- Ejecutar `git restore src/Frontend/src/views/Clientes/ClientesDashboard.tsx` para deshacer los cambios visuales aplicados.

## Success Criteria

- [ ] La compilación con `npm run build` es exitosa.
- [ ] La tabla de clientes renderiza de forma balanceada y con alturas uniformes.
- [ ] Las mascotas en exceso se ocultan bajo una pill de `+N` que despliega un tooltip al hacer hover.
- [ ] El toolbar y la paginación tienen el estilo Bento del prototipo de Stitch.
