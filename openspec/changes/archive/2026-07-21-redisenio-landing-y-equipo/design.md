# Design: Rediseño de Portal Público (Landing & Equipo)

## Technical Approach

Implementaremos el rediseño sin romper el consumo de APIs del backend. Para ello, los archivos modificados conservarán la lógica de React Hooks (`useEffect`, `useState`) y routing de React Router DOM (`useNavigate`, `useLocation`), actualizando únicamente la capa de marcado (JSX) y las clases de estilo.

Mapearemos el HTML y las clases de Tailwind de los archivos `code.html` a los archivos de JSX correspondientes:
1. `inicio_vetcarepro_rehecho/code.html` -> [LandingPage.tsx](file:///c:/Users/yaran/Documents/antigravity/Veterinaria/src/Frontend/src/views/PortalPublico/LandingPage.tsx) y [PublicHeader.tsx](file:///c:/Users/yaran/Documents/antigravity/Veterinaria/src/Frontend/src/views/PortalPublico/PublicHeader.tsx)
2. `nuestro_equipo_vetcarepro/code.html` -> [EquipoPublic.tsx](file:///c:/Users/yaran/Documents/antigravity/Veterinaria/src/Frontend/src/views/PortalPublico/EquipoPublic.tsx)

Para los estilos, agregaremos la clase `.ambient-shadow` en [index.css](file:///c:/Users/yaran/Documents/antigravity/Veterinaria/src/Frontend/src/index.css) con el degradado del prototipo:
```css
.ambient-shadow {
    box-shadow: 0px 4px 20px rgba(26, 83, 92, 0.05);
}
```

## Architecture Decisions

### Decision: Mantener Framer Motion y React hooks de servicios/veterinarios
- **Choice**: Conservar la interactividad dinámica existente. En el prototipo el HTML es estático, pero en producción el landing y la página del equipo obtienen la información de la API de C#.
- **Rationale**: Mantiene la lógica de negocio y permite que el contenido sea editable desde el panel de administración.

### Decision: Reemplazar clases de Tailwind por clases de Tailwind v4 nativas
- **Choice**: Las clases de espaciado como `py-stack-lg` se adaptarán usando la especificación del tema en `index.css` o valores equivalentes en el CSS v4 `@theme`.

## Data Flow

```
+------------------------------------+
|         ServiciosService           |
|      (Servicios API backend)       |
+-----------------+------------------+
                  |
                  v  (fetchServices)
+-----------------+------------------+
|         LandingPage.tsx            |
|  (Renderiza Bento Grid dinámico    |
|   con clases de inicio_rehecho)    |
+------------------------------------+
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| [index.css](file:///c:/Users/yaran/Documents/antigravity/Veterinaria/src/Frontend/src/index.css) | Modify | Agregar clase `.ambient-shadow` y asegurar variables de Tailwind v4 para `primary-container`. |
| [PublicHeader.tsx](file:///c:/Users/yaran/Documents/antigravity/Veterinaria/src/Frontend/src/views/PortalPublico/PublicHeader.tsx) | Modify | Estilizar el nav superior usando clases de hover y botones redondeados premium del prototipo. |
| [LandingPage.tsx](file:///c:/Users/yaran/Documents/antigravity/Veterinaria/src/Frontend/src/views/PortalPublico/LandingPage.tsx) | Modify | Rediseñar estructura Hero, Bento de especialidades, Testimonios y CTA final. |
| [EquipoPublic.tsx](file:///c:/Users/yaran/Documents/antigravity/Veterinaria/src/Frontend/src/views/PortalPublico/EquipoPublic.tsx) | Modify | Rediseñar el listado bento del equipo, badges de especialidad y recruitment. |

## Testing Strategy

- **Pruebas Manuales**:
  - Verificar visualmente la responsividad del Hero y el Bento de Especialidades en vistas de teléfono, tablet y portátil.
  - Asegurar que al hacer click en "Book Appointment" o "Reserva tu Cita" se redirija a la autenticación / panel.
- **Pruebas de Compilación**:
  - Ejecutar `npm run build` en el frontend para validar que TypeScript no tenga errores con los nuevos elementos de marcado.
