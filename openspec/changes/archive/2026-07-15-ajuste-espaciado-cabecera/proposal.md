# Proposal: Ajuste de Espaciado de Cabecera

## Intent

Reducir el espacio vertical excesivo y desperdiciado entre la barra de navegación superior (`TopAppBar`) y el título principal de las páginas del panel administrativo (iniciando con `ClientesDashboard.tsx`), mejorando el aprovechamiento del espacio en pantallas de laptop.

## Scope

### In Scope
- Ajustar el padding superior del contenedor principal de la vista en `ClientesDashboard.tsx` para reducir la distancia con el `TopAppBar`.
- Asegurar que la reducción sea responsiva y mantenga la consistencia en el layout general de la aplicación.

### Out of Scope
- Modificaciones a la lógica de negocio de clientes.
- Cambios de color o tipografía.

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- None (cambio puramente estético de espaciado)

## Approach

- Reemplazar la clase `md:p-10` por un espaciado superior más compacto (`md:pt-4 md:px-10 md:pb-10`) en `ClientesDashboard.tsx`.
- Verificar que el ajuste acerque el título de manera armoniosa a la barra superior sin comprometer la legibilidad.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/Frontend/src/views/Clientes/ClientesDashboard.tsx` | Modified | Ajuste de paddings superiores en el contenedor principal. |

## Risks

None.

## Rollback Plan

- Ejecutar `git restore src/Frontend/src/views/Clientes/ClientesDashboard.tsx` para restablecer el padding original de `md:p-10`.

## Success Criteria

- [ ] El espacio vertical entre `TopAppBar` y `Directorio de Clientes` se reduce visualmente de forma notable.
- [ ] La compilación con `npm run build` es exitosa.
