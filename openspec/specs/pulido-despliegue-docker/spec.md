# pulido-despliegue-docker Specification

## Purpose

Defines requirements and acceptance scenarios for automated database backup services, retention management, disaster recovery restoration scripts, multi-stage production Docker Compose deployment with Frontend Nginx, and commercial documentation.

## Requirements

### Requirement: Automated Database Backup and Retention Management

The system MUST run a background service (`DatabaseBackupService`) in ASP.NET Core 10 that automatically generates daily database backup files (`.bak` or `.sql`) in the persistent volume directory `/app/backups`. The service MUST automatically delete backup files older than 30 days and provide administrative REST API endpoints (`/api/backup/trigger`, `/api/backup/download/{filename}`) with audit logging (`IAuditoriaService`).

#### Scenario: Automatic daily backup execution
- GIVEN the ASP.NET Core Web API running in production
- WHEN the scheduled backup timer triggers at the configured interval (e.g. daily at 02:00 AM)
- THEN the system MUST generate a timestamped database backup file in `/app/backups`
- AND register an audit log entry of type `Backup` with severity `Info`.

#### Scenario: Automatic retention purge of old backups
- GIVEN existing backup files in `/app/backups` where some files have creation dates older than 30 days
- WHEN the `DatabaseBackupService` runs its cleanup routine
- THEN the system MUST delete all backup files older than 30 days
- AND preserve all backup files within the 30-day window.

---

### Requirement: Disaster Recovery Database Restore Script

The system MUST provide an executable disaster recovery script (`scripts/restore-db.sh` or `.ps1`) capable of restoring the SQL Server/PostgreSQL database from a specified backup file inside the containerized environment within 5 minutes.

#### Scenario: Database restoration from backup
- GIVEN a valid database backup file `backup_20260805.sql` in the backup volume
- WHEN the administrator executes `restore-db.sh backup_20260805.sql`
- THEN the script MUST verify file integrity, apply schema/data restoration, and verify database connectivity.

---

### Requirement: Multi-Stage Production Docker Compose Deployment

The system MUST provide a production-ready `docker-compose.prod.yml` orchestrating Frontend, Backend, and Database containers. The Frontend container MUST build via a Node 22 multi-stage Dockerfile and serve static SPA assets with `nginx:alpine` on ports 80/443 with gzip compression, SPA fallback (`try_files $uri /index.html`), and security headers. All services MUST include active healthchecks.

#### Scenario: Full stack production container launch
- GIVEN Docker Engine and Docker Compose installed on the host server
- WHEN the administrator executes `docker compose -f docker-compose.prod.yml up -d`
- THEN the system MUST start Frontend (Nginx), Backend (.NET 10 Web API), and Database containers
- AND all services MUST pass their healthcheck probes and accept web requests at `http://localhost`.

---

### Requirement: Commercial Documentation & Production Deployment Manual

The system MUST include a comprehensive `README.md` containing Clean Architecture C4 diagrams, technology stack badges, environment variable instructions, step-by-step Docker deployment guide, and UI screenshots.

#### Scenario: New developer or client onboarding via README
- GIVEN a new developer or system administrator accessing the repository
- WHEN reading `README.md`
- THEN it MUST provide complete, copy-pasteable shell commands for Docker Compose deployment, database restoration, and test execution.
