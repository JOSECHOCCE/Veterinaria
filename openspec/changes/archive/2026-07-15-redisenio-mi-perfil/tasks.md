# Tasks: Rediseño de Mi Perfil Portal

## Review Workload Forecast

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Rediseñar vista de Mi Perfil | Single PR | npm run build | npm run dev | src/Frontend/src/views/PortalCliente/MiPerfil.tsx |

## Phase 1: Layout Grid & Personal Information Card

- [x] 1.1 Diseñar la columna izquierda (`lg:col-span-8`) con el avatar del cliente y overlay de cámara.
- [x] 1.2 Diseñar la sección de Información de la Cuenta (modo lectura deshabilitado con icono de candado).
- [x] 1.3 Diseñar los campos de entrada de contacto (Teléfono, Dirección) con borde premium.

## Phase 2: Security & Account Status Widgets

- [x] 2.1 Diseñar el formulario de seguridad de la columna derecha (`lg:col-span-4`) para cambiar contraseña.
- [x] 2.2 Diseñar el widget Bento de Estado de la Cuenta.

## Phase 3: Communication Preferences & Actions

- [x] 3.1 Rediseñar la sección de canales de alerta y el pie de botones de guardado.

## Phase 4: Verification

- [x] 4.1 Ejecutar `npm run build` en el frontend y validar que compile sin errores.
- [x] 4.2 Probar que el flujo de actualización de perfil siga funcionando correctamente.
