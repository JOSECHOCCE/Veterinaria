## Exploration: ui-redesign-stitch

### Current State
El frontend de VetCare Pro está construido en React + TypeScript y Tailwind CSS v4. Sin embargo, varias pantallas principales (como el Login y el Dashboard) no siguen consistentemente el sistema de diseño premium configurado en `index.css`. Algunas de ellas tienen estilos en línea (`style={{...}}`) y colores de paletas genéricas de Tailwind (como `bg-emerald-100` o `bg-amber-100`) en lugar de usar los tokens de la marca (`bg-surface-card`, `text-ink`, `bg-canvas`, etc.). Esto hace que la aplicación luzca poco uniforme, básica y con menor calidad visual de la proyectada.

En contraste, contamos con la carpeta `.ai-context/stitch_vetcare_pro_master_ui` que contiene 38 carpetas de prototipos con código HTML de alta fidelidad, paletas de colores exclusivas, layouts responsivos, y assets listos para ser portados directamente a componentes de React.

### Affected Areas
- `src/Frontend/src/views/Auth/Login.tsx` — Contiene estilos en línea e layouts básicos que deben reemplazarse con el código premium del prototipo de Stitch (`acceso_al_sistema_vetcare_pro`).
- `src/Frontend/src/views/Dashboard/Dashboard.tsx` — Utiliza badges con paletas estándar de Tailwind y no aprovecha la estructura de cuadrantes del panel diario del administrador de Stitch (`dashboard_diario_operativo_admin`).
- `src/Frontend/src/views/PortalCliente/MisMascotas.tsx` — Requiere ajustes de alineación y estilización para terminar de consolidar el uso de orbes tridimensionales y anillos de actividad (Activity Rings) de Stitch.
- `src/Frontend/src/index.css` — Es el archivo del tema centralizado; debe revisarse para garantizar que todos los tokens definidos en las pantallas de Stitch se encuentren configurados correctamente.

### Approaches
1. **Refactorización Integral usando Prototipos de Stitch (Recomendado)** — Portar directamente la estructura HTML, las clases de utilidad y la jerarquía de los prototipos Stitch a cada componente React, utilizando Framer Motion para micro-interacciones (hover, loading, transiciones de pantalla) y enlazando los formularios a los estados existentes.
   - Pros: Máxima fidelidad visual, consistencia total con el diseño de Stitch, remoción de estilos inline y unificación del sistema de diseño.
   - Cons: Requiere un esfuerzo significativo para migrar múltiples pantallas de forma controlada.
   - Effort: High

2. **Remodelación Estética Rápida (Parcial)** — Mantener los layouts actuales en React y simplemente cambiar los nombres de las clases CSS genéricas por los tokens definidos en `index.css` y arreglar los estilos en línea más críticos.
   - Pros: Menor tiempo de desarrollo, menor riesgo de romper lógica o peticiones a APIs.
   - Cons: No se adopta la distribución de componentes ni la estética premium de los prototipos de Stitch. La aplicación seguirá viéndose algo básica en su estructura de layouts.
   - Effort: Medium

### Recommendation
Recomendamos el **Approach 1 (Refactorización Integral usando Prototipos de Stitch)**. Dado que el objetivo es elevar el nivel profesional de la UI y eliminar el aspecto básico de la aplicación, es fundamental portar los componentes visuales exactos de Stitch de forma secuencial y controlada. Esto no solo unificará la experiencia, sino que corregirá de raíz las inconsistencias de estilos acoplados (como los estilos en línea en el login) y permitirá añadir micro-animaciones premium con Framer Motion.

### Risks
- **Riesgo de Regresión Funcional**: Al modificar la UI de las vistas principales, se podrían desconectar involuntariamente eventos de envío de formularios, estados controlados de React (`useState`) o flujos de redirección (`useNavigate`). Se requiere verificar la consistencia de cada formulario y enlace.
- **Rompimiento de Pruebas**: Aunque las pruebas de backend no se verán afectadas, cualquier cambio en las llamadas o dependencias de componentes del frontend debe hacerse con cuidado para mantener la integración de servicios.

### Ready for Proposal
Yes — Estamos listos para proceder con la propuesta detallada (`sdd-propose`) en la cual definiremos el alcance inicial de la remodelación visual, priorizando las pantallas principales (Login, Dashboard de Admin y Portal de Clientes) para mitigar el esfuerzo en una primera iteración y cumplir con la estrategia de PRs controlados.
