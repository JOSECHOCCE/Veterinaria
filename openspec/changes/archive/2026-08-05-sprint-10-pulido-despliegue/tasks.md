# Tasks: Sprint 10 — Pulido, Responsividad, Backup Automático y Despliegue Docker

## Review Workload Forecast

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: stacked-to-main
400-line budget risk: Low

| Field | Value |
|-------|-------|
| Estimated changed lines | ~280 lines |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR (MVP Hardening Release) |
| Delivery strategy | single-pr |
| Chain strategy | stacked-to-main |

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Backup Service & Disaster Recovery Script | PR 1 | `dotnet test --filter DatabaseBackupServiceTests` | Endpoint `/api/backup/trigger` | `DatabaseBackupService.cs`, `BackupController.cs`, `restore-db.sh` |
| 2 | Multi-Threaded Concurrency Test Suite | PR 1 | `dotnet test --filter ConcurrencyStockPaymentTests` | `Task.WhenAll` (20 hilos) | `ConcurrencyStockPaymentTests.cs` |
| 3 | Docker Compose & Nginx Containerization | PR 1 | `docker compose -f docker-compose.prod.yml config` | `curl http://localhost:80` | `Dockerfile`, `nginx.conf`, `docker-compose.prod.yml` |
| 4 | Mobile Responsive Cards & Sidebar Drawer | PR 1 | `npm run test` / Manual Viewport | Chrome DevTools (375px) | `Sidebar.tsx`, `TriajeList.tsx` |

---

## Phase 1: Foundation & Infrastructure (Backend Backup Service & Recovery)

- [x] 1.1 Create `IDatabaseBackupService.cs` and `DatabaseBackupService.cs` in `Veterinaria.Application/Services` implementing daily cron backups and 30-day retention cleanup.
- [x] 1.2 Register `DatabaseBackupService` as `IHostedService` in `Veterinaria.Web/Program.cs`.
- [x] 1.3 Create `BackupController.cs` in `Veterinaria.Web/Controllers` exposing `/api/backup/trigger` and `/api/backup/download/{filename}` for Admin.
- [x] 1.4 Create disaster recovery shell script `scripts/restore-db.sh` to apply database restoration inside containers.

## Phase 2: Testing & Concurrency (Multi-Threaded Stress Verification)

- [x] 2.1 [RED] Write failing concurrency test `ConcurrencyStockPaymentTests.cs` in `Veterinaria.Tests` calling 20 parallel payment tasks via `Task.WhenAll`.
- [x] 2.2 [GREEN] Ensure `KardexService` and `CajaService` handle atomic row locks with isolated `DbContext` instances to pass all 20 threads.
- [x] 2.3 [REFACTOR] Clean up test assertions verifying stock zero balance and exact Kardex entry counts.

## Phase 3: Containerization & Deployment (Docker Compose & Nginx)

- [x] 3.1 Create `src/Frontend/Dockerfile` multi-stage build (Node 22 build -> `nginx:alpine` runtime).
- [x] 3.2 Create `src/Frontend/nginx.conf` with SPA fallback (`try_files $uri /index.html`), gzip compression, and security headers.
- [x] 3.3 Create `docker-compose.prod.yml` orchestrating Frontend (Nginx), Backend (.NET 10 API), and Database with healthchecks and persistent `/app/backups` volume.

## Phase 4: Mobile Responsive UI & Layout Hardening (RNF-011)

- [x] 4.1 Update `src/Frontend/src/components/layout/Sidebar.tsx` with mobile hamburger toggle and slide-out overlay drawer for screen widths < 768px.
- [x] 4.2 Update `src/Frontend/src/views/Atencion/ColaAtencion.tsx` to render patient queue as responsive cards on mobile viewports (< 768px).

## Phase 5: Documentation & Quality Gate (DoD)

- [x] 5.1 Update `README.md` with Clean Architecture diagrams, technology badges, step-by-step Docker deployment guide, and UI screenshots.
- [x] 5.2 Execute full test suite `dotnet test` to confirm 100% pass rate.

