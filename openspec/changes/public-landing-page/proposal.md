# Proposal: Public Landing Page Redesign

## Intent

Introduce a modern, premium multi-page public portal at the root of the site consisting of four connected public views (Inicio, Servicios, Equipo, and Contacto) based directly on the Stitch HTML prototypes. This portal will define the global visual identity and brand colors of VetCare Pro.

## Scope

### In Scope
- Create four new public views:
  - [LandingPage.tsx](file:///c:/Users/yaran/Documents/antigravity/Veterinaria/src/Frontend/src/views/LandingPage.tsx) (Inicio)
  - [ServiciosPublic.tsx](file:///c:/Users/yaran/Documents/antigravity/Veterinaria/src/Frontend/src/views/PortalPublico/ServiciosPublic.tsx) (Servicios)
  - [EquipoPublic.tsx](file:///c:/Users/yaran/Documents/antigravity/Veterinaria/src/Frontend/src/views/PortalPublico/EquipoPublic.tsx) (Nuestro Equipo)
  - [ContactoPublic.tsx](file:///c:/Users/yaran/Documents/antigravity/Veterinaria/src/Frontend/src/views/PortalPublico/ContactoPublic.tsx) (Contacto)
- Configure routes in [App.tsx](file:///c:/Users/yaran/Documents/antigravity/Veterinaria/src/Frontend/src/App.tsx) for `/`, `/servicios`, `/equipo`, and `/contacto`.
- Connect all pages via navigation links (header and footer).
- Update global theme variables in [index.css](file:///c:/Users/yaran/Documents/antigravity/Veterinaria/src/Frontend/src/index.css) to align with the Stitch teal palette.
- Implement responsive mobile menu toggle across all pages.

### Out of Scope
- Backend endpoints or API integrations (use static data matching the prototypes).
- Dynamic database lookups for services or team members.
- Interactive contact form submission logic (UI elements only).

## Capabilities

### New Capabilities
- `public-portal`: Orchestrates the four public pages (Inicio, Servicios, Equipo, Contacto) with global header/footer navigation.

### Modified Capabilities
- None

## Approach

1. Standardize colors, typography, and styling tokens in `index.css` using the prototype's teal scheme.
2. Develop the four views under a `PortalPublico` module using standard React + TSX and Tailwind CSS v4.
3. Map public routes in `App.tsx` and dynamically render header CTA buttons depending on the user's authentication state.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| [App.tsx](file:///c:/Users/yaran/Documents/antigravity/Veterinaria/src/Frontend/src/App.tsx) | Modified | Configure public portal routes. |
| `src/Frontend/src/views/PortalPublico/` | New | Create LandingPage, ServiciosPublic, EquipoPublic, and ContactoPublic. |
| [index.css](file:///c:/Users/yaran/Documents/antigravity/Veterinaria/src/Frontend/src/index.css) | Modified | Re-align theme brand colors. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Route access collision | Low | Keep public routes public and check auth state inside the shared header component. |
| Code duplication in headers/footers | Low | Extract the header and footer into shared components for the public portal. |

## Rollback Plan

Revert changes using git:
```bash
git checkout -- src/Frontend/src/App.tsx src/Frontend/src/index.css
rm -rf src/Frontend/src/views/PortalPublico/
```

## Dependencies

- None

## Success Criteria

- [ ] Users can navigate between Inicio, Servicios, Equipo, and Contacto seamlessly.
- [ ] Header booking button or dashboard button reflects authentication state.
- [ ] Build compiles without warnings or errors.

