# Tasks: Commercial POS/Veterinary Dashboard Redesign

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~350-450 lines |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Install recharts & build dashboard widgets | PR 1 | `npm run lint` | Vite Dev Server | `src/Frontend/src/components/dashboard/` |
| 2 | Refactor Dashboard view & integrate layout | PR 1 | `npx tsc -b` | Browser verification | `src/Frontend/src/views/Dashboard/Dashboard.tsx` |

## Phase 1: Foundation & Dependencies

- [x] 1.1 Install `recharts` library in `src/Frontend/package.json`.
- [x] 1.2 Create `src/Frontend/src/components/dashboard/` directory.

## Phase 2: Core Widget Component Implementation

- [x] 2.1 Create `KpiCard.tsx` in `components/dashboard/` with pastel variants (`orange`, `blue`, `green`, `purple`, `rose`), sol currency formatting, and period badges.
- [x] 2.2 Create `SalesTrendChart.tsx` using Recharts `<AreaChart>` with monotone gradient curve and custom hover tooltips.
- [x] 2.3 Create `CategoryDistributionChart.tsx` using Recharts `<PieChart>` / `<Pie>` for donut distribution.
- [x] 2.4 Create `LowStockAlertBanner.tsx` for stock warning notifications.

## Phase 3: Dashboard Layout Assembly

- [x] 3.1 Refactor `src/Frontend/src/views/Dashboard/Dashboard.tsx` header with welcome message and quick CTA buttons (`+ Nueva Cita`, `Exportar`).
- [x] 3.2 Wire `KpiCard` grid for Admin vs Recepcionista roles.
- [x] 3.3 Wire `SalesTrendChart` and `CategoryDistributionChart` grid.
- [x] 3.4 Wire `LowStockAlertBanner` and recent appointments data table.

## Phase 4: Quality & Verification

- [x] 4.1 Execute `npm run lint` in `src/Frontend` to verify no linting errors.
- [x] 4.2 Execute `npx tsc -b` in `src/Frontend` to verify TypeScript compilation.
