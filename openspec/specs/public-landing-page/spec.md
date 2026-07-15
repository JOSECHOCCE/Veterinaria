# Public Portal Specification

## Purpose

Define the user-facing functional requirements and navigation for the public multi-page portal of VetCare Pro (routes: `/`, `/servicios`, `/equipo`, `/contacto`).

## Requirements

### Requirement: Shared Navigation Header & Footer
Every public page MUST render a common header and footer. The header MUST feature navigation links (Inicio, Servicios, Equipo, Contacto) and a dynamic call to action (CTA).

#### Scenario: Display Header for Guest User
- GIVEN the user is not authenticated
- WHEN the user views any public page
- THEN the system MUST display navigation links
- AND the CTA button MUST say "Iniciar Sesión" (or similar login action)

#### Scenario: Display Header for Authenticated User
- GIVEN the user is authenticated
- WHEN the user views any public page
- THEN the system MUST display navigation links
- AND the CTA button MUST say "Ir a mi Panel" (or similar dashboard action)

---

### Requirement: Page Routing
The system MUST serve the appropriate public view for each path without forcing authentication.

#### Scenario: Navigating Public Routes
- GIVEN the user is not authenticated
- WHEN the user visits `/`, `/servicios`, `/equipo`, or `/contacto`
- THEN the system MUST render the corresponding view (Inicio, Servicios, Equipo, or Contacto)
- AND the system MUST NOT redirect the user to `/login`

---

### Requirement: Responsive Mobile Navigation Menu
On mobile viewports, the header menu MUST collapse into a single toggle icon that displays navigation links when clicked.

#### Scenario: Toggle Menu on Mobile
- GIVEN the viewport width is mobile sized
- WHEN the user clicks the menu toggle button
- THEN the system MUST show the navigation links
- AND clicking the button again MUST hide the links

