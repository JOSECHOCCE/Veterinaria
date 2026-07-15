# Design: Rediseño de Registrar Cliente

## Technical Approach

Rediseñar la interfaz de `RegistrarCliente.tsx` para ajustarse a los requerimientos visuales del prototipo Stitch. Se estructurará el formulario en dos secciones principales (Bento Cards) utilizando `bg-surface-container-lowest` y bordes finos. Los campos tendrán iconos alineados verticalmente y se integrará la advertencia de duplicados como una alerta premium de advertencia de Material 3.

## Architecture Decisions

### Decision: Inputs con iconos embebidos

| Opción | Tradeoff | Decisión |
|---|---|---|
| Inputs simples sin iconos | No se asemeja al estilo del prototipo de Stitch. | Rechazado |
| Inputs con iconos absolutos a la izquierda | Aporta una guía visual rápida y se alinea con la estética premium de Stitch. | **Elegido** |

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/Frontend/src/views/Clientes/RegistrarCliente.tsx` | Modify | Reestructurar maquetación del formulario, clases e iconos en inputs. |

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Manual | Flujo de guardado y advertencia de duplicados | Intentar registrar un cliente con datos duplicados existentes y verificar el renderizado del banner y del checkbox. |
| Build | Compilación de Vite | Validar la compilación estática. |
