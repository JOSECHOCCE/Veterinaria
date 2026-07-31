# Tasks: Time Period Filters for Dashboard (Hoy / Semana / Mes)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~120-180 lines |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Period filtering API & UI | Single PR | `dotnet test` & `npx tsc -b` | Frontend Vite & Backend .NET | `DashboardController.cs`, `DashboardService.cs`, `Dashboard.tsx` |

## Phase 1: Backend Infrastructure & Endpoint

- [x] 1.1 Update `IDashboardService.cs` signature to accept `string periodo = "mes"`.
- [x] 1.2 Update `DashboardService.cs` implementation to parse `periodo` (`"hoy"`, `"semana"`, `"mes"`) and compute `inicioFecha` using `DateTime.UtcNow`.
- [x] 1.3 Apply `inicioFecha` filtering on Citas, Pagos, and Servicio estadísticas LINQ queries in `DashboardService.cs`.
- [x] 1.4 Update `DashboardController.cs` to pass `[FromQuery] string periodo = "mes"` parameter to `_dashboardService.GetDashboardDataAsync(periodo)`.

## Phase 2: Frontend Service & Component Wiring

- [x] 2.1 Update `dashboard.service.ts` to accept `periodo?: 'hoy' | 'semana' | 'mes'` in `getDashboardData`.
- [x] 2.2 Add `periodo` state (`'hoy' | 'semana' | 'mes'`, default `'mes'`) in `Dashboard.tsx`.
- [x] 2.3 Add "Pill Toggle" UI buttons (`Hoy`, `7 Días`, `Este Mes`) in the header section of `Dashboard.tsx`.
- [x] 2.4 Trigger `fetchDashboardData(periodo)` when the user selects a new period pill button.

## Phase 3: Verification & Build Check

- [x] 3.1 Run `npx tsc -b` to verify TypeScript compilation in Frontend.
- [x] 3.2 Verify backend compilation with `dotnet build src/Backend/Veterinaria.Web`.
