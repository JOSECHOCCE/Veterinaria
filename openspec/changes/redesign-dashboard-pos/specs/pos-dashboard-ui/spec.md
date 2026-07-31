# pos-dashboard-ui Specification

## Purpose

Define the UI component standards and layout contracts for commercial-grade POS/Veterinary dashboards.

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
