# Design: Rediseño de Mis Pagos Portal

## Technical Approach

La pantalla de "Mis Pagos" se reestructurará en un Bento Grid responsivo integrado por:
1. **Bento de Balances**:
   * Tarjeta 1: Gasto Total con tendencia positiva/negativa y un avatar de billetera (`bg-primary-container/20`).
   * Tarjeta 2: Saldo Pendiente con estado de color de alerta si es mayor a cero.
   * Tarjeta 3: Tarjeta de método de pago preferido.
2. **Listado de Pagos Pendientes**:
   * Si existen pendientes, se presentarán en una tabla limpia con bordes redondeados y botones "Pagar saldo" de fácil interacción.
3. **Historial de Transacciones**:
   * Cada transacción del historial mostrará un avatar de icono representativo del servicio recibido (por ejemplo, `vaccines`, `medication`, `medical_services`, `local_hospital`).
   * Descarga interactiva de recibo PDF mediante botón de acción de un solo clic.
4. **Modal de Pago Glassmorphism**:
   * El formulario de entrada de tarjeta de crédito se presentará en un modal glassmorphism translúcido con inputs limpios y validaciones dinámicas.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/Frontend/src/views/PortalCliente/MisPagos.tsx` | Modify | Reemplazar el layout y aplicar el diseño M3 premium. |

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Manual | Comportamiento Responsivo y Pasarela de Pago | Validar el grid en escritorio/móvil, la apertura del modal y la validación de los campos de la tarjeta. |
| Build | Compilación de Vite | Validar la compilación estática. |
