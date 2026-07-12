## Exploration: public-landing-page

### Current State
Actualmente, VetCare Pro no tiene una página de inicio pública (landing page). La ruta raíz (`/`) del frontend en `src/Frontend/src/App.tsx` redirige directamente a los usuarios no autenticados a `/login` y a los autenticados a sus respectivos paneles según el rol (como `/cliente/portal`, `/admin/dashboard`, etc.). 

Para definir la identidad visual y los colores aplicados al sitio completo, necesitamos introducir una página de aterrizaje pública en la raíz (`/`) que sirva de presentación del sistema, muestre los servicios de la veterinaria y ofrezca botones de llamada a la acción (CTA) claros para "Iniciar Sesión" y "Registrarse".

### Affected Areas
- `src/Frontend/src/App.tsx` — Modificar la ruta raíz (`/`) para cargar el nuevo componente de la Landing Page, y actualizar la lógica de redirección de usuarios que ya están autenticados.
- `src/Frontend/src/views/LandingPage.tsx` — [NEW] Componente que contendrá la página pública, utilizando el sistema de diseño de Tailwind v4 y las variables definidas en `index.css`.
- `src/Frontend/src/index.css` — Servirá para verificar y ajustar los colores clave de la marca (primary, surface-card, canvas, accent-teal) garantizando su contraste y apariencia premium en la landing.

### Approaches
1. **Landing Page de Alta Fidelidad y Ricas Estéticas (Recomendado)** — Diseñar una landing page moderna con una sección hero impactante, una grilla con los servicios principales de la clínica (aprovechando los servicios sembrados en la base de datos), testimonios, barra de navegación interactiva y un pie de página. Todo estilizado con los tokens de Stitch (tipografía Copernicus/StyreneB, colores cálidos, bordes redondeados amplios y transiciones de Framer Motion).
   - Pros: Establece un estándar estético alto y profesional, define el uso correcto del contraste cromático y tipográfico de la aplicación.
   - Cons: Requiere un desarrollo detallado de layouts responsivos para móviles y tablets.
   - Effort: Medium

2. **Landing Page Minimalista Básica** — Crear una página extremadamente sencilla con el logo de VetCare Pro, una breve descripción y dos botones de acceso.
   - Pros: Desarrollo rápido y bajo riesgo.
   - Cons: No define realmente la identidad visual ni los colores/estilos que se heredarán en el resto de las pantallas internas.
   - Effort: Low

### Recommendation
Recomendamos el **Approach 1 (Landing Page de Alta Fidelidad y Ricas Estéticas)**. Es el enfoque ideal para fijar el rumbo del diseño completo del sitio, asegurando que la landing page sorprenda al usuario y sirva como guía de estilo para el rediseño del portal y la administración interna.

### Risks
- **Redirección de Rutas**: Es necesario asegurarse de que los usuarios autenticados que visiten `/` puedan navegar al portal del cliente o administración sin trabas, o ser redirigidos si es necesario de forma transparente.

### Ready for Proposal
Yes — La exploración está lista. Podemos pasar a crear la propuesta de diseño técnico (`sdd-propose`) para definir el layout de la landing page y el mapeo de colores.
