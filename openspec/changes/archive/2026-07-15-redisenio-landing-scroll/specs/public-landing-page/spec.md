# Delta for public-landing-page

## ADDED Requirements

### Requirement: Public Viewport Scrollability

All public-facing pages (routes: `/`, `/servicios`, `/equipo`, `/contacto`) MUST allow vertical scrolling of the viewport when content exceeds the window height.

#### Scenario: Verify Public Pages Scroll
- GIVEN the user is on a public route (`/`, `/servicios`, `/equipo`, `/contacto`)
- WHEN the page content exceeds the viewport height
- THEN the browser MUST display a vertical scrollbar
- AND the user MUST be able to scroll to the bottom of the page to read the header, body, and footer content.
