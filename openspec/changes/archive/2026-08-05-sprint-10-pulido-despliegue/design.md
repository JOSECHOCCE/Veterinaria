# Design: Sprint 10 — Pulido, Responsividad, Backup Automático y Despliegue Docker

## Technical Approach

Implement the final hardening and deployment setup for **VetCare Pro** (MVP SaaS release):
1. **Responsive UI**: Apply TailwindCSS v4 responsive utilities (`hidden md:block`, `grid-cols-1 md:grid-cols-3`) to transform horizontal tables into touch-friendly cards on mobile devices (< 768px).
2. **Concurrency Stress Suite**: Create `ConcurrencyStockPaymentTests.cs` using `Task.WhenAll` across 15-20 parallel threads to verify atomic database transactions (`IDbContextTransaction`) and stock deduction in Kardex without race conditions.
3. **Database Backup Service**: Implement `DatabaseBackupService` as a native .NET 10 `IHostedService` with daily cron execution, retention policy (purge > 30 days), administrative REST endpoints in `BackupController.cs`, and a shell recovery script `scripts/restore-db.sh`.
4. **Production Docker Compose**: Build a multi-stage Dockerfile for Frontend (Node 22 build -> Nginx Alpine SPA) and configure `docker-compose.prod.yml` with healthcheck probes and persistent volumes for data and backups.
5. **Commercial Documentation**: Expand `README.md` with Clean Architecture diagrams, Docker commands, environment setup, and screenshots.

## Architecture Decisions

| Decision Title | Choice Made | Alternatives Considered | Rationale |
|---|---|---|---|
| **Backup Execution Engine** | Native `IHostedService` in ASP.NET Core 10 | OS Linux Cron script / External tool | Integrates backup execution directly with `IAuditoriaService` logs and provides REST API triggers inside the admin panel. |
| **Frontend Production Server** | Multi-stage Docker with `nginx:alpine` | Node.js `serve` / Vite preview server | Nginx offers maximum performance, low RAM footprint (~15MB), SPA fallback (`try_files`), gzip compression, and security headers. |
| **Concurrency Testing Pattern** | `Task.WhenAll` with thread-isolated `DbContext` | Sequential loop tests | Simulates real-world parallel web requests attempting simultaneous checkout of limited inventory. |
| **Mobile Table Layout** | Collapsible `Card` components on `< 768px` | Horizontal table overflow scrolling | Touch targets > 44px on mobile screens ensure ease of use for veterinarians and assistants during clinical rounds. |

## Data Flow

```
[Mobile / Desktop Client] ──(HTTPS)──> [Nginx Container (Port 80/443)]
                                                │
                                        (Reverse Proxy / SPA Fallback)
                                                ▼
                                    [.NET 10 Web API Container (Port 8080)]
                                                │
                 ┌──────────────────────────────┼──────────────────────────────┐
                 ▼                              ▼                              ▼
      [Kardex / Payment DB]          [DatabaseBackupService]         [Concurrency Lock]
      (EF Core Transaction)           (Daily Cron / 02:00 AM)         (IDbContextTransaction)
                 │                              │                              │
                 ▼                              ▼                              ▼
      [Stock Deducted Atomically]    [/app/backups Volume (.sql)]   [Isolated Concurrent Tasks]
```

## File Changes

| File Path | Action | Description |
|---|---|---|
| `src/Frontend/Dockerfile` | Create | Multi-stage Dockerfile: Node 22 build -> Nginx Alpine runtime. |
| `src/Frontend/nginx.conf` | Create | Nginx SPA routing fallback, gzip compression, and security headers. |
| `docker-compose.prod.yml` | Create | Production compose with Nginx Frontend, .NET API, DB and volumes. |
| `src/Backend/Veterinaria.Application/Services/DatabaseBackupService.cs` | Create | `IHostedService` for scheduled backups and 30-day retention purge. |
| `src/Backend/Veterinaria.Web/Controllers/BackupController.cs` | Create | Endpoints `/api/backup/trigger` and `/api/backup/download/{file}`. |
| `src/Backend/Veterinaria.Tests/Application/ConcurrencyStockPaymentTests.cs` | Create | Multi-threaded concurrency tests with 15-20 parallel `Task` instances. |
| `scripts/restore-db.sh` | Create | Disaster recovery database restoration script. |
| `src/Frontend/src/components/layout/Sidebar.tsx` | Modify | Responsive hamburger menu and drawer overlay for mobile viewports. |
| `src/Frontend/src/views/Triaje/TriajeList.tsx` | Modify | Mobile cards layout for patient queue in screen width < 768px. |
| `README.md` | Modify | Complete commercial README with Docker guide and Clean Architecture diagram. |

## Interfaces / Contracts

```csharp
// Backend Backup Contract
public interface IDatabaseBackupService
{
    Task<string> CreateBackupAsync(CancellationToken cancellationToken = default);
    Task PurgeOldBackupsAsync(int retentionDays = 30, CancellationToken cancellationToken = default);
    IEnumerable<BackupFileInfo> ListBackups();
}

public record BackupFileInfo(string FileName, long SizeBytes, DateTime CreatedAt);
```

```typescript
// Frontend Responsive Breakpoint Utility Contract
export interface MobileCardProps<T> {
  data: T[];
  renderCard: (item: T) => React.ReactNode;
  renderTable: () => React.ReactNode;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| **Unit / Stress** | Concurrency on payment checkout and Kardex stock reduction | `ConcurrencyStockPaymentTests.cs` using `Task.WhenAll` (20 parallel tasks) verifying atomic locks and stock limits. |
| **Integration** | `DatabaseBackupService` execution and retention cleanup | Unit/Integration test checking backup file generation and purge of files > 30 days old. |
| **E2E / Container** | Docker Compose deployment and SPA routing | Playwright / curl test verifying `docker compose -f docker-compose.prod.yml up` and Nginx HTTP response on port 80. |

## Threat Matrix

N/A — Standard containerized ASP.NET Core & Nginx Web API stack. Backup API restricted to `Administrador` role with path traversal validation (`Path.GetFileName`).

## Migration / Rollout

No database schema migration required. Deployment is executed via `docker compose -f docker-compose.prod.yml up --build -d`.

## Open Questions

- None. Technical design and architecture are complete.
