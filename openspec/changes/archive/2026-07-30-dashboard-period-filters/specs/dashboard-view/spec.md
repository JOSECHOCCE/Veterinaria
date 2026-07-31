# Delta for dashboard-view

## MODIFIED Requirements

### Requirement: Role-Based Dashboard Layout Rendering

The system MUST render a responsive dashboard layout (`src/Frontend/src/views/Dashboard/Dashboard.tsx`) tailored to the authenticated user's role (Admin vs Recepcionista), featuring a top welcome header with quick actions, time period filter pills (`Hoy` | `7 Días` | `Este Mes`), KPI metric grid, revenue charts, and operational summary tables.
(Previously: Rendered a fixed monthly view without period filter toggles)

#### Scenario: Admin viewing the full dashboard with default period
- GIVEN an authenticated user with `Admin` role
- WHEN the Dashboard page loads successfully
- THEN it MUST load data using `periodo=mes` by default
- AND it MUST render financial KPIs, sales area chart, top services bar chart, revenue bar chart, vet ranking, species donut chart, low stock alert banner, and recent appointment table.

#### Scenario: Switching time period filter
- GIVEN an authenticated user viewing the Dashboard page
- WHEN the user clicks on the `Hoy` or `7 Días` period filter pill
- THEN the system MUST trigger a GET request to `/api/Dashboard?periodo=hoy` or `/api/Dashboard?periodo=semana`
- AND update all KPI metric cards, charts, and summary statistics to reflect the selected time window dynamically.

#### Scenario: Recepcionista viewing the dashboard
- GIVEN an authenticated user with `Recepcionista` role
- WHEN the Dashboard page loads
- THEN it MUST display operational KPIs (Citas Hoy, Atenciones Pendientes, Mascotas Atendidas) and recent appointment table
- BUT it SHALL NOT expose global financial accounting summaries.
