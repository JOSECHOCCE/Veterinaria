# Proposal: Rediseño de Registrar Cliente (Iteración 2)

## Intent

Rediseñar la pantalla de registro de clientes (`RegistrarCliente.tsx`) para alinearla con el prototipo de Stitch, aplicando el diseño visual Bento, las clases de Tailwind v4 y los inputs con iconos integrados. Asegurar además que se respeten los estados de duplicados y la navegación limpia de retorno.

## Scope

### In Scope
- Rediseñar `RegistrarCliente.tsx` aplicando el estilo visual Bento.
- Agregar iconos internos posicionados de forma absoluta dentro de los inputs de Teléfono, Documento y Correo Electrónico.
- Ajustar el padding superior del contenedor principal (`md:pt-4 md:px-10 md:pb-10`) para mantener la homogeneidad visual con el listado de clientes.
- Estilizar el banner de advertencia por duplicados al estilo Material 3 y Stitch.

### Out of Scope
- Modificaciones en la lógica de validación del lado del servidor (backend).
- Cambios en las llamadas a `ClientesService` (mantener intactas).

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- None

## Approach

- Reestructurar el formulario en dos Bento Cards: "Información Principal" (Datos Personales) y "Detalles Adicionales" (Datos de Contacto).
- Integrar clases de Tailwind para los inputs: `w-full h-12 pl-10 pr-4 rounded-lg bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors`.
- Posicionar iconos absolutos (`absolute left-3 top-1/2 -translate-y-1/2`) en cada campo correspondiente.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/Frontend/src/views/Clientes/RegistrarCliente.tsx` | Modified | Rediseño de formulario, campos y banner de advertencia. |

## Risks

None.

## Rollback Plan

- Ejecutar `git restore src/Frontend/src/views/Clientes/RegistrarCliente.tsx` para restablecer el formulario a su estado original.

## Success Criteria

- [ ] La compilación con `npm run build` es exitosa.
- [ ] La interfaz visual del formulario se alinea estéticamente con la estructura Bento y el listado de clientes.
- [ ] La advertencia de duplicados se muestra con la misma estética premium y ofrece la opción de ignorar y forzar el registro.
