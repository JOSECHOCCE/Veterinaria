# Tasks: Rediseño de Ficha de Cliente 360°

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 200-250 lines |
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
| 1 | Rediseñar vista de ficha de cliente con Bento Grid | Single PR | npm run build | npm run dev | src/Frontend/src/views/Clientes/FichaClienteDetalle.tsx |

## Phase 1: Header & Spacing

- [x] 1.1 Modificar la envoltura superior a `p-6 md:pt-4 md:px-10 md:pb-10 max-w-[1400px] mx-auto`.
- [x] 1.2 Integrar el encabezado superior con botón de volver atrás, título de perfil de cliente y botones de acción ("Inactivar/Activar" y "Editar").

## Phase 2: Identity & Financial Cards (Row 1)

- [x] 2.1 Maquetar la tarjeta de identidad mostrando avatar, nombre, dirección, teléfono, correo electrónico, fecha de registro y DNI.
- [x] 2.2 Maquetar la tarjeta de estado financiero con "Total Histórico Facturado" y "Deuda Pendiente" destacando la morosidad si es mayor a cero.

## Phase 3: Pets & History (Row 2)

- [x] 3.1 Maquetar la tarjeta de Mascotas Asociadas, mostrando foto (o icono de huella), nombre, raza y sexo con hover transitions.
- [x] 3.2 Maquetar la sección de Historial de Citas usando una línea de tiempo vertical con badges de colores para el estado de cada cita.

## Phase 4: Verification

- [x] 4.1 Ejecutar `npm run build` en el frontend y validar que compile sin errores.
- [x] 4.2 Probar manualmente la visualización del perfil del cliente y el funcionamiento de las acciones de activación/inactivación.
