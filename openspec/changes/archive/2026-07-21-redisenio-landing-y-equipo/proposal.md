# Proposal: Rediseño de Landing Page y Portal de Equipo

## Intent

Actualizar el diseño de la página de inicio (`LandingPage.tsx`) y de la página del equipo (`EquipoPublic.tsx`) en el portal público de VetCare Pro. El objetivo es portar fielmente las mejoras visuales, colores de acento, sombras ambientales, bordes redondeados tipo bento y componentes de layout definidos en los nuevos prototipos Stitch (`inicio_vetcarepro_rehecho` y `nuestro_equipo_vetcarepro`).

## Scope

### In Scope
- **Estilos globales (`index.css`)**:
  - Asegurar la definición de los tokens de color del prototipo: `primary` (`#006a63`), `primary-container` (`#4fd1c5`), `surface-container-low` (`#f1f4f6`), `bg-surface` y las sombras decorativas como `.ambient-shadow`.
- **Componente Header (`PublicHeader.tsx`)**:
  - Ajustar clases para usar el menú y botón de CTA con transiciones más suaves y las clases de color del prototipo.
- **Landing Page (`LandingPage.tsx`)**:
  - Rediseñar el Hero integrando la tarjeta de contenedor `bg-surface-container-low` y el badge superior "Clínica Veterinaria Premium".
  - Rediseñar el área de Stats clave utilizando la tarjeta integrada en blanco con separadores de línea vertical.
  - Rediseñar el Bento de Servicios destacados incorporando la estructura del prototipo rehecho (imágenes con overlays de opacidad, badges redondeados y líneas inferiores en los títulos).
  - Rediseñar la sección de CTA con fondo `bg-primary` y los orbes difuminados de fondo en degradado radial.
- **Equipo Page (`EquipoPublic.tsx`)**:
  - Rediseñar la página de equipo público implementando la estructura responsiva del bento grid de 3 columnas de especialidades.
  - Mantener la integración dinámica con el backend (fetch de veterinarios activos) pero formateando la salida visual usando las clases de tarjeta de especialidades del nuevo prototipo.
  - Adaptar los badges superiores sobre las fotos de los veterinarios y las citas célebres.

### Out of Scope
- Nuevas rutas en el portal público.
- Modificación del modelo de datos de la base de datos o endpoints del backend (se mantendrá el consumo del backend actual).
- Lógica de autenticación del Portal del Cliente.

## Capabilities

### Modified Capabilities
- `public-portal`: Interfaz visual mejorada del portal público de cara al cliente y visitantes.

## Approach

1. **Tokens en CSS**: Modificar `index.css` si es necesario para agregar clases de utilidad como `.ambient-shadow` y asegurar los mapeos de Tailwind v4 de `primary-container` y colores de superficie.
2. **Header y Footer**: Ajustar `PublicHeader.tsx` y `PublicFooter.tsx` alineándolos con los estilos de los prototipos Stitch.
3. **Refactor de Landing**: Modificar el código de `LandingPage.tsx` portando la estructura de HTML del prototipo Stitch rehecho a componentes de React (manteniendo Framer Motion para las animaciones y la carga dinámica de especialidades desde la API del backend).
4. **Refactor de Equipo**: Modificar `EquipoPublic.tsx` portando los estilos y bento del prototipo Stitch de equipo, conservando el fetch de la API.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| [LandingPage.tsx](file:///c:/Users/yaran/Documents/antigravity/Veterinaria/src/Frontend/src/views/PortalPublico/LandingPage.tsx) | Modified | Rediseño visual del Hero, Stats, Servicios, Testimoniales y CTA final. |
| [EquipoPublic.tsx](file:///c:/Users/yaran/Documents/antigravity/Veterinaria/src/Frontend/src/views/PortalPublico/EquipoPublic.tsx) | Modified | Rediseño visual del Bento Grid del equipo de veterinarios y el recruitment CTA. |
| [PublicHeader.tsx](file:///c:/Users/yaran/Documents/antigravity/Veterinaria/src/Frontend/src/views/PortalPublico/PublicHeader.tsx) | Modified | Ajuste de clases de botones, colores y efectos hover/backdrop. |
| [index.css](file:///c:/Users/yaran/Documents/antigravity/Veterinaria/src/Frontend/src/index.css) | Modified | Asegurar la inclusión de clases como `.ambient-shadow` y colores de acento. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Desalineación de fuentes y tamaños de Tailwind v4 | Low | Mapear correctamente los nombres de clases modificados de Tailwind en `index.css` y no pisar estilos de otras vistas internas. |
| Pérdida de interactividad dinámica (API endpoints) | Low | Asegurar que el mapeo del array de `services` y de `vets` siga conectado a los `useState` correspondientes en React. |

## Rollback Plan

Revertir los archivos a su último estado limpio en Git:
```bash
git checkout -- src/Frontend/src/views/PortalPublico/LandingPage.tsx \
             src/Frontend/src/views/PortalPublico/EquipoPublic.tsx \
             src/Frontend/src/views/PortalPublico/PublicHeader.tsx \
             src/Frontend/src/index.css
```

## Dependencies

- Ninguna dependencia de backend. Depende del estado actual de `src/Frontend/`.

## Success Criteria

- [ ] Las páginas de inicio y equipo compilan con éxito sin errores de tipado o imports.
- [ ] La UI en modo escritorio y móvil es idéntica a la guía y look premium de los prototipos Stitch.
- [ ] La carga de servicios y veterinarios desde la API del backend sigue funcionando correctamente y renderizando las tarjetas dinámicas con el nuevo diseño.
- [ ] Los enlaces de navegación (Header y Footer) funcionan sin roturas.
