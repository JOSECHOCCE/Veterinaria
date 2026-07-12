# Design: Public Landing Page Redesign

## Technical Approach

We will create a multi-page public portal consisting of four connected views under a new folder `src/Frontend/src/views/PortalPublico/`:
1. `LandingPage.tsx` (Inicio)
2. `ServiciosPublic.tsx` (Servicios)
3. `EquipoPublic.tsx` (Equipo)
4. `ContactoPublic.tsx` (Contacto)

To ensure consistency, we will extract the common navigation elements from the Stitch prototypes into shared header and footer components:
- `PublicHeader.tsx`
- `PublicFooter.tsx`

We will update the global CSS theme in `index.css` to match the teal-based brand palette of the Stitch design system.

## Architecture Decisions

### Decision: Reconcile Brand Colors in CSS Variables

**Choice**: Update global `--color-*` variables in `index.css` to match the Stitch brand colors (teal `#006a63` and slate `#006494`).
**Alternatives considered**: Applying inline color styles in components.
**Rationale**: Changing the global theme variables defines the brand identity globally, flowing automatically into other pages like the Login and Dashboard.

---

### Decision: Shared Public Layout Components

**Choice**: Create reusable header/footer components in the frontend.
**Alternatives considered**: Copying layout HTML into each individual page.
**Rationale**: Standardizes navigation links, ensures active states are consistent, and consolidates the mobile drawer menu logic in one file.

## Data Flow

No API integration is required since this is a pure frontend visual redesign. All services, team cards, and contact details will utilize static datasets mapped to the components.

```
                  +--------------------------------+
                  |            App.tsx             |
                  |     (Public Router Config)     |
                  +---------------+----------------+
                                  |
         +------------------------+------------------------+
         |                        |                        |
         v                        v                        v
+------------------+     +------------------+     +------------------+
| LandingPage.tsx  |     | ServiciosPublic. |     |  ContactoPublic. |
| (PublicHeader /  |     | (PublicHeader /  |     | (PublicHeader /  |
|  PublicFooter)   |     |  PublicFooter)   |     |  PublicFooter)   |
+------------------+     +------------------+     +------------------+
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| [App.tsx](file:///c:/Users/yaran/Documents/antigravity/Veterinaria/src/Frontend/src/App.tsx) | Modify | Route `/`, `/servicios`, `/equipo`, `/contacto`. |
| `PortalPublico/LandingPage.tsx` | New | Main landing page (Inicio). |
| `PortalPublico/ServiciosPublic.tsx` | New | Public services display page. |
| `PortalPublico/EquipoPublic.tsx` | New | Public our team display page. |
| `PortalPublico/ContactoPublic.tsx` | New | Public contact/appointment info page. |
| `PortalPublico/PublicHeader.tsx` | New | Shared navigation navbar component. |
| `PortalPublico/PublicFooter.tsx` | New | Shared footer component. |
| [index.css](file:///c:/Users/yaran/Documents/antigravity/Veterinaria/src/Frontend/src/index.css) | Modify | Update primary and secondary theme variables. |

## Interfaces / Contracts

Header utilizes `AuthContext` to determine the booking button state:

```typescript
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Public routing configuration | Verify `/`, `/servicios`, `/equipo`, and `/contacto` routes map to correct components. |
| Unit | Context-aware booking button | Verify header displays "Ir a mi Panel" when logged in, and "Reserva una Cita" when guest. |
| Manual | Mobile drawer menu toggling | Verify the navigation drawer toggles open/closed on mobile viewport clicks. |

## Threat Matrix

`N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.`

## Migration / Rollout

No database migrations or backend changes required. Pure frontend deployment.

## Open Questions

None.

