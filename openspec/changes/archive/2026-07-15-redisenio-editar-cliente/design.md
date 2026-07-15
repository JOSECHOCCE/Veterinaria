# Design: Rediseño de Editar Cliente

## Technical Approach

Aplicar la misma reestructuración Bento del formulario de registro en `EditarCliente.tsx`. Esto incluye el uso de `bg-surface-container-lowest`, bordes y sombras Bento, inputs de alto 48px (`h-12`) con iconos en posición absoluta (`absolute left-3`), y el contenedor de espaciado compacto `md:pt-4`.

## Architecture Decisions

### Decision: Reutilización de estilos de formulario

| Opción | Tradeoff | Decisión |
|---|---|---|
| Diferente estilo de inputs | Confunde al usuario y rompe la consistencia del sistema de diseño. | Rechazado |
| Replicar diseño de RegistrarCliente | Mantiene la coherencia visual del módulo de Clientes y simplifica el mantenimiento. | **Elegido** |

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/Frontend/src/views/Clientes/EditarCliente.tsx` | Modify | Ajustar maquetación del formulario e iconos internos de campos. |

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Manual | Edición exitosa de datos | Intentar editar un cliente, guardar los cambios y comprobar que se guarde correctamente y redireccione a la ficha. |
| Build | Compilación de Vite | Validar la compilación estática. |
