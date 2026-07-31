# Design: Commercial POS/Veterinary Dashboard Redesign

## Technical Approach

Build modular React components (`KpiCard`, `SalesTrendChart`, `CategoryDistributionChart`, `LowStockAlertBanner`) using `recharts` for vector data visualization and TailwindCSS for responsive pastel tint layout. Refactor `Dashboard.tsx` to compose these components while preserving backend API data bindings (`dashboardService.getDashboardData()`) and role-based permissions (`Admin` vs `Recepcionista`).

## Architecture Decisions

### Decision 1: Chart Library Selection
- **Choice**: Recharts (`recharts`)
- **Alternatives considered**: Chart.js / react-chartjs-2, ApexCharts
- **Rationale**: Recharts offers declarative JSX components (`<AreaChart>`, `<Area>`, `<Tooltip>`, `<ResponsiveContainer>`), excellent TypeScript integration, seamless CSS/Tailwind customization, and easy SVG gradient definitions (`<linearGradient>`).

### Decision 2: Modular Component Extraction
- **Choice**: Place reusable dashboard UI widgets in `src/Frontend/src/components/dashboard/`
- **Alternatives considered**: Single monolithic `Dashboard.tsx` file (current state)
- **Rationale**: Extracts 450+ lines of monolithic JSX into testable, focused components (`KpiCard.tsx`, `SalesTrendChart.tsx`, `CategoryDistributionChart.tsx`, `LowStockAlertBanner.tsx`).

## Data Flow

```text
dashboardService.getDashboardData()
         │
         ▼
    Dashboard.tsx (State: data, loading, error)
         │
 ┌───────┼───────────────────┬──────────────────────┐
 ▼       ▼                   ▼                      ▼
KpiCards SalesTrendChart CategoryDonutChart LowStockAlertBanner
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/Frontend/package.json` | Modify | Add `recharts` dependency |
| `src/Frontend/src/components/dashboard/KpiCard.tsx` | Create | Reusable pastel-tinted KPI card widget |
| `src/Frontend/src/components/dashboard/SalesTrendChart.tsx` | Create | Recharts Area chart with gradient fill for weekly/monthly sales |
| `src/Frontend/src/components/dashboard/CategoryDistributionChart.tsx` | Create | Recharts Pie/Donut chart for sales distribution by service/category |
| `src/Frontend/src/components/dashboard/LowStockAlertBanner.tsx` | Create | Soft red/rose alert banner for critical stock items |
| `src/Frontend/src/views/Dashboard/Dashboard.tsx` | Modify | Refactor layout to use new POS dashboard components |

## Interfaces / Contracts

```typescript
export interface KpiCardProps {
  title: string;
  amount: string;
  subtitle?: string;
  badgeText?: string;
  icon: React.ReactNode;
  variant: 'orange' | 'blue' | 'green' | 'purple' | 'rose';
  onClick?: () => void;
}

export interface SalesDataPoint {
  label: string;
  amount: number;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | KpiCard rendering and variant classes | React Testing Library / Vitest / Playwright component tests |
| E2E | Role-based visibility and dashboard navigation | Playwright E2E (`npx playwright test`) |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No database migration required. Backward compatible UI component update consuming existing `DashboardViewModelDto` API contracts.
