# Design: Rediseño de Ficha de Cliente 360°

## Technical Approach

Reestructurar `FichaClienteDetalle.tsx` en un bento grid responsivo (`grid`). La primera fila contendrá la tarjeta de identidad (2 columnas en pantallas grandes) y la tarjeta de estado financiero (1 columna). La segunda fila contendrá las tarjetas de mascotas asociadas (1 columna) y el historial de citas (1 columna). Los paddings superiores se ajustarán a `md:pt-4` para mantener la coherencia.

## Architecture Decisions

### Decision: Distribución del Bento Grid en Ficha de Cliente

| Opción | Tradeoff | Decisión |
|---|---|---|
| Lista vertical simple (Actual) | Requiere mucho scroll vertical y desperdicia espacio horizontal en monitores anchos. | Rechazado |
| Grid de 2 filas y columnas proporcionales | Agrupa la información de contacto y balance arriba de forma destacada, y la historia (mascotas y citas) abajo de forma detallada. | **Elegido** |

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/Frontend/src/views/Clientes/FichaClienteDetalle.tsx` | Modify | Reestructurar maquetación completa a Bento Grid de dos filas. |

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Manual | Estado dinámico de deuda y toggle de cliente | Verificar que el botón de inactivar/activar cambie el estado en caliente. |
| Build | Compilación de Vite | Validar la compilación estática. |
