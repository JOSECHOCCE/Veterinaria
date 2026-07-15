## MODIFIED Requirements

### Requirement: Dynamic Services and Staff

The landing, services, and team public pages (`LandingPage.tsx`, `ServiciosPublic.tsx`, `EquipoPublic.tsx`) MUST display actual services and staff members fetched dynamically from the system backend database via `/api/Servicios` and `/api/Veterinarios` without requiring authentication (`[AllowAnonymous]` access on GET endpoints). Furthermore, the frontend rendering MUST reliably display all fetched cards regardless of viewport height or scrolling delays, avoiding animation states that leave items permanently hidden (`opacity: 0`) after asynchronous data loads.

#### Scenario: Fetch Active Services Dynamically
- **GIVEN** the visitor opens the Services page (`/servicios`) or Landing page (`/`)
- **WHEN** the page loads and requests active services from `/api/Servicios`
- **THEN** the system MUST return all active services (`s.activo === true`) without 401 Unauthorized errors
- **AND** the UI MUST render each service card dynamically with exact names, descriptions, durations (`duracionMinutos`), and formatted prices (`precio`), ensuring cards become visible immediately upon rendering.

#### Scenario: Fetch Veterinarians Dynamically
- **GIVEN** the visitor opens the Team page (`/equipo`) or Landing page (`/`)
- **WHEN** the page loads and requests active veterinarians from `/api/Veterinarios`
- **THEN** the system MUST return all active veterinarians without requiring authentication
- **AND** the UI MUST render their full names, specialties, schedules, and contact details (email and telephone when available) in responsive cards that transition cleanly to visible state.

## ADDED Requirements

### Requirement: Reliable Asynchronous Grid Rendering and Animations

The public portal views (`LandingPage.tsx`, `ServiciosPublic.tsx`, `EquipoPublic.tsx`) SHALL configure Framer Motion (`motion.section`, `motion.div`, `motion.article`) container and item variants such that asynchronous data updates triggered after initial render (`useEffect` loading completion) cleanly trigger and propagate entry animations (`opacity: 1`, `y: 0`), preventing race conditions where child elements remain invisible (`hidden` state) if the parent intersection observer (`whileInView`) fired during the loading phase.

#### Scenario: Grid items visible after async load completes
- **GIVEN** a public page is loading dynamic data with a visual spinner displayed inside the grid container
- **WHEN** the API request completes and the component state updates with the fetched array of services or veterinarians
- **THEN** the grid items MUST render with fully visible opacity and layout on the user's screen without requiring manual scrolling beyond the initial viewport.

### Requirement: Cohesive Public Portal UI and Aesthetics

The public portal pages (`/`, `/servicios`, `/equipo`, `/contacto`) SHALL maintain high visual impact, rich aesthetics, clear typography, and responsive grid layouts (Bento grids and card grids) that accurately reflect the veterinary medical offerings and professional team of VetCare Pro.

#### Scenario: Empty State Handling
- **GIVEN** the backend database temporarily returns zero active services or veterinarians
- **WHEN** the page renders after data fetching completes
- **THEN** the UI SHALL display a clear, well-styled informative empty state message indicating no items are available, rather than a blank space.
