# Design: Rediseño de Mis Mascotas Portal

## Technical Approach

La pantalla de "Mis Mascotas" será reestructurada en un grid bento responsivo empleando la paleta de colores de VetCarePro:
1. **Tarjeta de Registro Rápido**:
   * Usará un contenedor punteado premium (`border-dashed border-outline-variant hover:border-primary`) con animación hover que incita a registrar.
2. **Tarjeta de Mascota Premium**:
   * Cada tarjeta presentará un círculo decorativo semitransparente en la esquina superior derecha (`bg-secondary-container rounded-bl-full`).
   * Mostrará un avatar circular centrado de la mascota con un anillo de color dinámico dependiente de la especie (`ring-primary-container` para perros y `ring-tertiary-container` para felinos/aves/otros).
   * Desplegará la edad y peso de manera tabulada en una caja interna con fondo suave (`bg-surface-container-low`).
   * Revelará la llamada a la acción "Ver Historial Clínico" al hacer hover sobre la tarjeta.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/Frontend/src/views/PortalCliente/MisMascotas.tsx` | Modify | Reemplazar el layout y aplicar el diseño M3 premium. |

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Manual | Comportamiento Responsivo y Hover | Validar en resoluciones de escritorio y móviles la correcta alineación del grid y la revelación suave del pie de la tarjeta. |
| Build | Compilación de Vite | Validar la compilación estática. |
