## Exploration: La página de Landing no hace scroll

### Current State
El sistema web tiene configurada una regla CSS global en `src/Frontend/src/index.css` que bloquea el scroll en todo el viewport exterior (`html, body { overflow: hidden !important; }`). Esto se introdujo para dar soporte a la estructura de panel administrativo (donde los layouts `ProtectedLayout` y `ClientLayout` manejan el scroll internamente en sus respectivos contenedores principales). Sin embargo, al renderizar páginas del portal público en la raíz (`/`, `/servicios`, `/equipo`, `/contacto`) fuera de estos layouts protegidos, las vistas quedan bloqueadas verticalmente y el usuario no puede hacer scroll para leer el contenido de la Landing Page, Servicios o Equipo.

### Affected Areas
- `src/Frontend/src/index.css` — Contiene la regla global `html, body { overflow: hidden !important; }`.
- `src/Frontend/src/views/PortalPublico/LandingPage.tsx` — Vista pública que requiere scroll vertical completo.
- `src/Frontend/src/views/PortalPublico/ServiciosPublic.tsx` — Vista pública que requiere scroll vertical completo.
- `src/Frontend/src/views/PortalPublico/EquipoPublic.tsx` — Vista pública que requiere scroll vertical completo.
- `src/Frontend/src/views/PortalPublico/ContactoPublic.tsx` — Vista pública que requiere scroll vertical completo.

### Approaches
1. **Remover `overflow: hidden !important` de `html, body` y aplicarlo solo a los Layouts Administrativos**
   - **Descripción**: Quitar la regla restrictiva de la base global CSS en `index.css` y mover la restricción de scroll únicamente a las clases o elementos contenedores de `Layout.tsx`, `ProtectedLayout.tsx` y `ClientLayout.tsx`.
   - **Pros**: Restaura el comportamiento natural de scroll en todas las páginas públicas de manera inmediata y limpia sin código extra en React.
   - **Cons**: Requiere asegurar que los layouts del dashboard administrativo no sufran desbordamiento doble de scrollbar si no tenían configurado correctamente su propio control de desbordamiento.
   - **Effort**: Bajo.

2. **Crear una clase CSS `.public-scroll-fix` y aplicarla condicionalmente al Body desde React**
   - **Descripción**: Agregar un efecto `useEffect` en las vistas públicas que altere la propiedad `document.body.style.overflow = 'auto'` al montarse y la restablezca a `hidden` al desmontarse.
   - **Pros**: Es muy aislado y no altera el archivo CSS global que los layouts de administración ya asumen.
   - **Cons**: Añade lógica repetitiva e imperativa de manipulación del DOM en múltiples componentes de React.
   - **Effort**: Medio.

### Recommendation
Recomendamos el **Enfoque 1 (Remover la regla restrictiva global de `html, body` en `index.css`)** y, si es necesario, asegurar de forma explícita la clase `overflow-hidden` y `h-screen` en los contenedores de los layouts del panel administrativo. Esto preserva el estándar HTML/CSS semántico, permitiendo scroll nativo por defecto y bloqueándolo únicamente donde la aplicación actúe como un panel de una sola página.

### Risks
- Desalineación menor en el panel administrativo si algún layout dependía del bloqueo implícito de `html, body` para evitar barras de desplazamiento duplicadas. Se mitigará verificando la compilación y la jerarquía de layouts.

### Ready for Proposal
Yes
