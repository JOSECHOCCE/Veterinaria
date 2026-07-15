# Design: Portal Público Dinámico

## Component Architecture
- **Vite React**:
  - `LandingPage.tsx` will fetch services and veterinarians. If API call fails, it falls back to a clean placeholder message or basic list.
  - `ServiciosPublic.tsx` will display a dynamic grid of services.
  - `EquipoPublic.tsx` will display a bento grid of veterinarians.

## Visual Design Details
- Keep the premium Bento Grid layout for the landing and team pages.
- Map service names to local images dynamically.
  - Service image selector helper:
    ```typescript
    const getServiceImage = (name: string) => {
      // name map:
      // "Consulta General" -> Consulta General.png
      // "Vacunación" -> Vacunación.png
      // "Cirugía Menor" -> Cirugía Menor.png
      // "Baño y Peluquería" -> Baño y Peluquería.png
      // "Desparasitación" -> Desparasitación.png
    }
    ```
- Use professional placeholder images or modern SVG illustrations for veterinarians that load dynamically.
