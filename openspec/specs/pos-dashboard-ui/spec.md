# pos-dashboard-ui Specification

## Purpose

Define the UI component standards, layout contracts, and mobile/tablet responsive behavior for commercial-grade POS/Veterinary dashboards and clinical views in VetCare Pro.

## Requirements

### Requirement: KPI Stat Card Rendering

The system MUST render KPI metric cards using tinted pastel backgrounds (`bg-orange-50`, `bg-blue-50`, `bg-emerald-50`, `bg-purple-50`, `bg-rose-50`), rounded corners (`rounded-2xl`), floating subtle shadows (`shadow-sm hover:shadow-md`), formatted currency in Peruvian Soles (`S/`), and period comparison badges.

#### Scenario: Displaying daily sales KPI
- GIVEN a valid dashboard state with daily sales data `1250 text`
- WHEN the KpiCard renders for daily sales
- THEN it MUST display `S/ 1,250.00` in bold font
- AND it MUST render with an orange pastel background tint (`bg-orange-50`) and a pill badge `Hoy`.

#### Scenario: Displaying low stock alert KPI
- GIVEN active inventory data with items below minimum threshold
- WHEN the KpiCard or alert banner renders for stock alerts
- THEN it MUST highlight the total count in red/rose tint (`bg-rose-50 text-rose-700`)
- AND it MUST provide a clickable action to navigate to inventory replenishment.

---

### Requirement: Interactive Sales Trend Area Chart

The system MUST render a responsive Area Chart using Recharts with smooth monotone curves, transparent area fill gradients, interactive hover tooltips, and formatted axis labels.

#### Scenario: Hovering over sales trend data point
- GIVEN the sales trend chart displays 7-day or 6-month revenues
- WHEN the user hovers over a data point
- THEN a custom floating tooltip MUST render displaying the date and formatted currency (`S/ X,XXX.XX`).

---

### Requirement: Donut Distribution Chart

The system MUST render a doughnut chart for category/service distribution with a wide central cutout, clean color palette, and clear right-aligned legend.

#### Scenario: Rendering service distribution
- GIVEN category revenue distribution data
- WHEN the CategoryDistributionChart renders
- THEN it MUST display category shares with distinct color slices and a matching legend listing category names and percentages.

---

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
