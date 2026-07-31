# Design: Time Period Filters for Dashboard (Hoy / Semana / Mes)

## Technical Approach

Extend the backend `IDashboardService` and `DashboardController` in C# to accept an optional query parameter `periodo` (`"hoy"`, `"semana"`, `"mes"`, default `"mes"`). Calculate start date dynamically using `DateTime.UtcNow` based on the specified period, filtering appointment and payment EF Core LINQ queries. Update `dashboard.service.ts` in Vite/React to pass `periodo` and render a `PillToggle` in `Dashboard.tsx`.

## Architecture Decisions

### Decision: Filter calculation location (Backend vs Frontend)

**Choice**: Backend filtering via API query parameter.
**Alternatives considered**: Fetching all records and filtering client-side.
**Rationale**: Client-side filtering would require transferring large datasets over HTTP and violates domain separation for security and performance.

### Decision: Query Parameter naming and default

**Choice**: `[FromQuery] string periodo = "mes"`.
**Alternatives considered**: Enum `PeriodoFiltro` or custom date range `startDate`/`endDate`.
**Rationale**: String parameter with fallback ensures backward compatibility with existing frontends and keeps URL parameters clean (`?periodo=hoy`).

## Data Flow

    [User clicks 'Hoy' Pill] ──→ React State (`periodo='hoy'`) ──→ API GET `/api/Dashboard?periodo=hoy`
                                                                          │
    [DashboardViewModel Response] ‹── C# Service (EF LINQ with date filter) ┘

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/Backend/Veterinaria.Application/Interfaces/IDashboardService.cs` | Modify | Add `string periodo = "mes"` to `GetDashboardDataAsync` |
| `src/Backend/Veterinaria.Infrastructure/Services/DashboardService.cs` | Modify | Calculate `inicioFecha` according to `periodo` in LINQ queries |
| `src/Backend/Veterinaria.Web/Controllers/DashboardController.cs` | Modify | Accept `[FromQuery] string periodo = "mes"` parameter |
| `src/Frontend/src/services/dashboard.service.ts` | Modify | Update `getDashboardData(periodo?: string)` |
| `src/Frontend/src/views/Dashboard/Dashboard.tsx` | Modify | Add state `periodo`, pill buttons UI, and reload trigger |

## Interfaces / Contracts

### Backend Interface
```csharp
public interface IDashboardService
{
    Task<DashboardDto> GetDashboardDataAsync(string periodo = "mes");
}
```

### Frontend Service Method
```typescript
export const dashboardService = {
  getDashboardData: async (periodo: 'hoy' | 'semana' | 'mes' = 'mes') => {
    const response = await api.get('/api/Dashboard', { params: { periodo } });
    return response.data;
  }
};
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `DashboardService` date filtering logic | Test `GetDashboardDataAsync("hoy")` vs `"semana"` vs `"mes"` |
| Integration | `DashboardController` endpoint | Perform HTTP GET `/api/Dashboard?periodo=hoy` and verify HTTP 200 OK |
| E2E / Frontend | `Dashboard.tsx` UI Pill toggles | Verify network call and state change on pill click |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Rollback Plan

Revert parameter addition in `DashboardController.cs` to default to full month behavior.
