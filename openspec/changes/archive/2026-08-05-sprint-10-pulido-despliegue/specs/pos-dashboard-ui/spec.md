# Delta for pos-dashboard-ui

## ADDED Requirements

### Requirement: Mobile Responsive Adaptability and Collapsible Cards Layout

The system MUST render all core views (Triaje, SOAP, POS Botica, Agenda and Sidebar Navigation) responsively using TailwindCSS v4 breakpoints (`sm`, `md`, `lg`, `xl`). On mobile viewports (< 768px), horizontal data tables MUST collapse into stacked, touch-friendly card elements (`cards`), and navigation MUST collapse into a hamburger menu drawer to prevent horizontal scrolling or cut-off content.

#### Scenario: Viewing Triaje queue on a mobile device (375px width)
- GIVEN a user accessing the Triaje queue on a smartphone
- WHEN the screen width is less than 768px
- THEN the system MUST hide the horizontal table headers (`hidden md:table-header-group`)
- AND render each patient item as a stacked card with touch targets greater than 44px height.

#### Scenario: Toggling mobile navigation drawer
- GIVEN a user on a mobile viewport (< 768px)
- WHEN tapping the hamburger menu icon in the top header
- THEN the system MUST slide out a full-height navigation drawer with smooth transition overlay.
