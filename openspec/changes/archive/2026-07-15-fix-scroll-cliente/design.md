# Design: Corrección de Bloqueo de Scroll en el Portal del Cliente

## Technical Approach

Dado que la estructura del DOM raíz tiene deshabilitado el scroll mediante `overflow: hidden` a nivel global en la etiqueta `body`, la barra de desplazamiento nativa del navegador no se renderiza.
Para corregir esto de forma limpia y consistente con el panel de administración, convertiremos el layout de cliente (`ClientLayout.tsx`) en un contenedor flex de altura fija (`h-screen overflow-hidden`), permitiendo que sea el elemento `<main>` el que gestione el scroll vertical de manera local e interna mediante `overflow-y-auto`.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/Frontend/src/components/Layout/ClientLayout.tsx` | Modify | Ajustar el contenedor raíz a `h-screen overflow-hidden` y el contenedor main a `overflow-y-auto`. |

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Manual | Scroll interactivo | Cargar el portal de clientes con resolución reducida (o emulando pantalla pequeña) y verificar que sea posible hacer scroll en el contenido. |
| Build | Compilación de Vite | Validar la compilación estática. |
