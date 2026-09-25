# Proposal: Sprint 10 — Pulido, Responsividad, Backup Automático y Despliegue Docker

## Intent

Finalizar y endurecer la plataforma SaaS **VetCare Pro** (Cierre de MVP) para su despliegue productivo. Garantizar la usabilidad en dispositivos móviles/tablets para el personal clínico en atención directa, la prevención de *race conditions* en horas pico mediante pruebas de concurrencia, el resguardo automático de historias clínicas/datos con backups diarios de BD y la containerización reproducible en Docker.

## Scope

### In Scope
- **RNF-011 / HU-040 (UI Responsive)**: Breakpoints y layouts en TailwindCSS v4 para Triaje, SOAP, POS Botica y Sidebar menú.
- **RNF-015 / HU-041 (Pruebas Concurrencia)**: Suite C# `ConcurrencyStockPaymentTests.cs` (15-20 hilos simultáneos) en pagos e inventario.
- **RNF-008 / HU-042 (Backup Automático)**: `DatabaseBackupService` (`IHostedService` .NET 10) con retención de 30 días, endpoints en `BackupController` y script `scripts/restore-db.sh`.
- **RNF-016 / HU-043 (Docker Compose Productivo)**: `Dockerfile` Frontend Nginx multi-stage + `docker-compose.prod.yml` (Nginx, .NET 10 Web API, PostgreSQL/SQL Server) con volúmenes persistentes y healthchecks.
- **DoD / HU-044 (Documentación Comercial)**: Actualización integral de `README.md` comercial con arquitectura, insignias y manual de despliegue.

### Out of Scope
- Integración con pasarelas de pago externas en vivo (Stripe/Culqi real fuera del mock/simulador).
- Aplicación móvil nativa iOS/Android compilada (se cubre mediante PWA/Web Responsive).

## Capabilities

### New Capabilities
- `pulido-despliegue-docker`: Servicio de backup automatizado de BD con retención, script de restauración ante desastres y containerización productiva multi-servicio Docker Compose con Frontend Nginx.

### Modified Capabilities
- `caja-pagos-concurrencia`: Adición de especificación de pruebas multihilo explícitas de concurrencia e idempotencia en cobros y Kardex de inventario.
- `pos-dashboard-ui`: Refinamiento responsivo de vistas y layouts móviles/tablets en pantallas de Triaje, SOAP, POS y navegación.

## Approach

- **Frontend**: Multi-stage Docker build con Node 22 (compilación Vite) y `nginx:alpine` en puerto 80/443 con compresión gzip, fallback SPA y seguridad HTTP.
- **Backend**: Implementar `DatabaseBackupService` como `IHostedService` en .NET 10 para backups diarios de BD (`.bak`/`.sql`) con eliminación de volcados mayores a 30 días.
- **Concurrencia**: `xUnit` + `Task.WhenAll` en `ConcurrencyStockPaymentTests.cs` validando transacciones paralelas aisladas en DbContext.
- **UI Responsive**: Reemplazo de tablas desbordantes por tarjetas colapsables (`cards`) en dispositivos móviles (< 768px).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/Frontend/src/components/layout/Sidebar.tsx` | Modified | Menú hamburguesa responsivo y drawer móvil. |
| `src/Frontend/src/views/Triaje/TriajeList.tsx` | Modified | Tarjetas responsivas en lugar de tabla horizontal en móvil. |
| `src/Frontend/Dockerfile` | New | Multi-stage build Node 22 + Nginx Alpine. |
| `src/Frontend/nginx.conf` | New | Configuración servidor Nginx SPA fallback. |
| `docker-compose.prod.yml` | New | Orquestación productiva de servicios y BD. |
| `src/Backend/.../DatabaseBackupService.cs` | New | Servicio en segundo plano para respaldo automático de BD. |
| `src/Backend/.../BackupController.cs` | New | Endpoints administrativos para trigger/descarga backup. |
| `src/Backend/.../ConcurrencyStockPaymentTests.cs` | New | Suite de pruebas de concurrencia multihilo. |
| `README.md` | Modified | Documentación comercial y manual de producción. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Llenado de disco por backups acumulados | Med | Retención automática a 30 días en `DatabaseBackupService`. |
| Bloqueos transaccionales en SQLite en pruebas | Med | Instancias aisladas de DbContext por hilo en `Task.WhenAll`. |

## Rollback Plan

- Revertir cambios de git en `src/` mediante `git checkout main`.
- Detener contenedores Docker productivos con `docker compose -f docker-compose.prod.yml down -v`.

## Dependencies

- .NET 10 SDK & Node.js 20+
- Docker Engine & Docker Compose v2+

## Success Criteria

- [ ] 100% de la suite de pruebas (unitarias + concurrencia multihilo) pasando en `dotnet test`.
- [ ] Ejecución exitosa de `docker compose -f docker-compose.prod.yml up -d` exponiendo app en puerto 80/8080.
- [ ] Respaldo manual/programado de BD generado correctamente en directorio de backups.
- [ ] Visualización fluida y sin desbordamientos en resoluciones móvil (375px), tablet (768px) y desktop (1280px).
