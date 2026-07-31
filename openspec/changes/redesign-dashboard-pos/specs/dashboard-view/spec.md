# Delta for dashboard-view

## MODIFIED Requirements

### Requirement: Role-Based Dashboard Layout Rendering

The system MUST render a responsive dashboard layout (`src/Frontend/src/views/Dashboard/Dashboard.tsx`) tailored to the authenticated user's role (Admin vs Recepcionista), featuring a top welcome header with quick actions, KPI metric grid, revenue charts, and operational summary tables.

(Previously: Rendered basic financial hero card and plain appointment table without pastel KPI grid or Recharts visualizations)

#### Scenario: Admin viewing the full dashboard
- GIVEN an authenticated user with `Admin` role
- WHEN the Dashboard page loads successfully
- THEN it MUST render financial KPIs (Total Month, Today Sales, Average Ticket), sales area chart, category donut chart, low stock alert banner, and recent appointment table.

#### Scenario: Recepcionista viewing the dashboard
- GIVEN an authenticated user with `Recepcionista` role
- WHEN the Dashboard page loads
- THEN it MUST display operational KPIs (Citas Hoy, Atenciones Pendientes, Mascotas Atendidas) and recent appointment table
- BUT it SHALL NOT expose global financial accounting summaries.
