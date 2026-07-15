# Design: Rediseño de Mi Perfil Portal

## Technical Approach

La pantalla de "Mi Perfil" se reestructurará en un layout de rejilla responsiva integrada por:
1. **Columna Izquierda (`lg:col-span-8`)**:
   * **Avatar de Perfil**: Foto circular con overlay de cámara al hacer hover para simular "Actualizar Foto".
   * **Datos de Lectura**: Nombre Completo, DNI y Correo Electrónico (con icono de candado `lock` y fondo deshabilitado).
   * **Datos Editables**: Inputs premium para Teléfono de Contacto y Dirección.
2. **Columna Derecha (`lg:col-span-4`)**:
   * **Seguridad (Cambio de Contraseña)**: Inputs verticales para Contraseña Actual, Nueva y Confirmar.
   * **Estado de la Cuenta Widget**: Tarjeta estilizada con fondo `bg-primary-container` text-on-primary-container, icono grande `verified_user` en opacity 20, y badge `Verified User`.
3. **Preferencias y Botón de Envío**:
   * Preferencias de Comunicación con botón a configuración de notificaciones.
   * Botón único de guardar cambios centrado o alineado a la derecha en la base del formulario principal.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/Frontend/src/views/PortalCliente/MiPerfil.tsx` | Modify | Aplicar maquetación responsiva de dos columnas e inputs premium M3. |

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Manual | Diseño responsivo e interacción | Verificar el orden de las columnas en móvil y escritorio, y el flujo de guardado. |
| Build | Compilación de Vite | Validar la compilación estática. |
