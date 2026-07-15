# Tasks: Rediseño de Editar Cliente

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 150-200 lines |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Rediseñar vista editar cliente con Bento e iconos | Single PR | npm run build | npm run dev | src/Frontend/src/views/Clientes/EditarCliente.tsx |

## Phase 1: Header & Visual Container

- [x] 1.1 Modificar el padding contenedor de `EditarCliente.tsx` a `p-6 md:pt-4 md:px-10 md:pb-10`.
- [x] 1.2 Estructurar el encabezado de página usando el componente `PageHeader` con enlace de vuelta a la ficha.

## Phase 2: Bento Forms

- [x] 2.1 Maquetar la sección "Información Principal" con campos Nombre, Teléfono, Documento y Email con iconos absolutos a la izquierda.
- [x] 2.2 Maquetar la sección "Detalles Adicionales" con campos Dirección y Notas/Observaciones de Recepción.
- [x] 2.3 Estilizar y vincular la advertencia de duplicados utilizando el componente de alerta correspondiente.
- [x] 2.4 Vincular los estados de formulario y hooks correspondientes con la función `handleSubmit`.

## Phase 3: Verification

- [x] 3.1 Ejecutar `npm run build` en el frontend y validar que compile sin errores.
- [x] 3.2 Probar manualmente la validación de duplicados y redirección exitosa.
