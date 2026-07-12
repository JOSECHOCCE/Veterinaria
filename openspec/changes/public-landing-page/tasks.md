# Tasks: Public Landing Page Redesign

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~900 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (Header/Footer/Theme) -> PR 2 (Inicio/Servicios) -> PR 3 (Equipo/Contacto) |
| Delivery strategy | exception-ok |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: size-exception
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Global theme and common Header/Footer | PR 1 | npm run build | Verify header/footer compile | Revert index.css and remove components |
| 2 | Inicio and Servicios public pages | PR 2 | npm run build | Navigate to `/` and `/servicios` | Remove LandingPage.tsx, ServiciosPublic.tsx |
| 3 | Equipo and Contacto public pages | PR 3 | npm run build | Navigate to `/equipo` and `/contacto` | Remove EquipoPublic.tsx, ContactoPublic.tsx |

## Phase 1: Foundation (Header, Footer, Theme)

- [x] 1.1 Update CSS variables in [index.css](file:///c:/Users/yaran/Documents/antigravity/Veterinaria/src/Frontend/src/index.css) with Stitch brand colors (teal `#006a63` and slate `#006494`).
- [x] 1.2 Create `PublicHeader.tsx` inside `src/Frontend/src/views/PortalPublico/` with mobile menu toggling.
- [x] 1.3 Create `PublicFooter.tsx` inside `src/Frontend/src/views/PortalPublico/` with site credits and links.

## Phase 2: Pages Implementation (Inicio, Servicios)

- [x] 2.1 Create [LandingPage.tsx](file:///c:/Users/yaran/Documents/antigravity/Veterinaria/src/Frontend/src/views/PortalPublico/LandingPage.tsx) porting the home prototype structure.
- [x] 2.2 Create [ServiciosPublic.tsx](file:///c:/Users/yaran/Documents/antigravity/Veterinaria/src/Frontend/src/views/PortalPublico/ServiciosPublic.tsx) porting the services layout.

## Phase 3: Pages Implementation (Equipo, Contacto)

- [x] 3.1 Create [EquipoPublic.tsx](file:///c:/Users/yaran/Documents/antigravity/Veterinaria/src/Frontend/src/views/PortalPublico/EquipoPublic.tsx) porting the team profiles layout.
- [x] 3.2 Create [ContactoPublic.tsx](file:///c:/Users/yaran/Documents/antigravity/Veterinaria/src/Frontend/src/views/PortalPublico/ContactoPublic.tsx) porting the clinic coordinates and booking options.

## Phase 4: Integration & Verification

- [x] 4.1 Update route configuration in [App.tsx](file:///c:/Users/yaran/Documents/antigravity/Veterinaria/src/Frontend/src/App.tsx) to wire `/`, `/servicios`, `/equipo`, and `/contacto`.
- [x] 4.2 Run [npm run build](file:///c:/Users/yaran/Documents/antigravity/Veterinaria/src/Frontend) to verify TypeScript and build compilation success.

