## Why

Actualmente, el portal público y la página de inicio (`LandingPage.tsx`, `ServiciosPublic.tsx` y `EquipoPublic.tsx`) presentan inconsistencias críticas y problemas de visualización donde las secciones de servicios y equipo médico aparecen en blanco o mal alineadas con el backend. Esto se debe a un problema en la interacción entre la carga asíncrona de datos desde las APIs (`/api/Servicios` y `/api/Veterinarios`) y la configuración de animaciones con Framer Motion (`whileInView` con `once: true` y márgenes negativos sobre contenedores re-renderizados), además de que el diseño y el contenido ofrecido en las tarjetas deben ser totalmente coherentes, dinámicos, dinámicos y atractivos, alineados exactamente al sistema médico de VetCare Pro.

## What Changes

- Rediseño y mejora integral de la UI/UX en `LandingPage.tsx`, `ServiciosPublic.tsx` y `EquipoPublic.tsx`, garantizando una presentación estética, premium y totalmente responsiva.
- Corrección del fallo de visualización (tarjetas invisibles o en blanco) solucionando la lógica de animaciones en Framer Motion (`initial`, `animate` y `whileInView`) al cargar datos dinámicos de forma asíncrona.
- Integración robusta del consumo dinámico de `/api/Servicios` (servicios activos, precios, duraciones y descripciones) y `/api/Veterinarios` (especialistas, horarios, teléfonos y especialidades) sin restricciones de autenticación indebidas para usuarios públicos.
- Implementación de estados de carga elegantes (skeletons/spinners) y estados vacíos informativos en todas las vistas públicas.

## Capabilities

### New Capabilities
- (Ninguna capability nueva, se actualiza la existente del portal público)

### Modified Capabilities
- `public-landing-page`: Actualización de requisitos de renderizado dinámico, sincronización de animaciones con carga de datos asíncrona, y coherencia de contenido con las APIs de servicios y veterinarios.

## Impact

- **Frontend (`src/Frontend/src/views/PortalPublico/`)**: `LandingPage.tsx`, `ServiciosPublic.tsx`, `EquipoPublic.tsx`.
- **APIs consumidas (`src/Frontend/src/services/`)**: `servicios.service.ts`, `veterinarios.service.ts`, `api.ts`.
- **Backend (`src/Backend/Veterinaria.Web/Controllers/`)**: Verificación y aseguramiento del acceso público sin autenticación (`[AllowAnonymous]`) en endpoints de consulta general de `ServiciosController` y `VeterinariosController`.
