# Proposal: Rediseño de Editar Cliente (Iteración 4)

## Intent

Rediseñar la pantalla de edición de clientes (`EditarCliente.tsx`) para alinearla con el prototipo de Stitch, aplicando el diseño visual Bento y los inputs con iconos integrados de forma coordinada con la cabecera optimizada.

## Scope

### In Scope
- Rediseñar `EditarCliente.tsx` aplicando el estilo visual Bento.
- Agregar iconos internos posicionados de forma absoluta dentro de los inputs de Teléfono, Documento y Correo Electrónico.
- Ajustar el padding superior del contenedor principal (`md:pt-4 md:px-10 md:pb-10`).
- Estilizar el banner de advertencia por duplicados al estilo Material 3 y Stitch.

### Out of Scope
- Lógica de backend.

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- None

## Approach

- Dividir el formulario en Bento Cards y aplicar inputs responsivos con iconos absolutos a la izquierda.
- Sincronizar el formulario con los estados locales y la llamada `ClientesService.editarCliente`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/Frontend/src/views/Clientes/EditarCliente.tsx` | Modified | Rediseño de formulario de edición y banner de coincidencia. |

## Risks

None.

## Rollback Plan

- Ejecutar `git restore src/Frontend/src/views/Clientes/EditarCliente.tsx`.

## Success Criteria

- [ ] La compilación con `npm run build` es exitosa.
- [ ] La interfaz se adapta estéticamente al estilo visual Bento.
