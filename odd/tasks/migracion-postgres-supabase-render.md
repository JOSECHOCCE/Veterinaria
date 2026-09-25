# Migración a PostgreSQL (Supabase) y Despliegue en Render

## Objetivo
Migrar la capa de persistencia de VetCare Pro (.NET 10 Web API + EF Core) de SQL Server a PostgreSQL, configurando la conexión para Supabase (producción) y orquestando el despliegue del sistema completo en Render.

## Alcance y Restricciones
- **Base de Datos Producción:** Supabase PostgreSQL (Managed, SSL Mode Require, Pooler / Direct connection).
- **Backend:** ASP.NET Core 10 Web API en Render Web Service (Docker).
- **Frontend:** React 19 + Vite en Render Static Site o integrado en backend.
- **ORM:** Entity Framework Core con `Npgsql.EntityFrameworkCore.PostgreSQL`.
- **Compatibilidad:** Preservar `DbSeeder`, Identity, SignalR y modelos de dominio intactos.

## Tareas

- [x] **TASK-01: Migración de Dependencias a Npgsql**
  - Reemplazado `Microsoft.EntityFrameworkCore.SqlServer` por `Npgsql.EntityFrameworkCore.PostgreSQL` 8.0.11 en `Veterinaria.Infrastructure.csproj`.
  - Actualizado `Veterinaria.Tests.Integration` con `Testcontainers.PostgreSql` y `Npgsql`.
  - Restauración y compilación verificadas exitosamente.

- [x] **TASK-02: Configuración de DbContext y Conexión Supabase en Program.cs**
  - Configurado `.UseNpgsql(...)` en `Program.cs` con reintentos automáticos (`EnableRetryOnFailure`).
  - Añadido helper `ParsePostgreSqlConnectionString` para soportar URIs de Supabase (`postgresql://...`) y formatos estándar `Host=...`.
  - Habilitado `AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true)` para máxima compatibilidad con fechas.
  - Actualizados `appsettings.json` y `appsettings.Development.json` con cadenas de conexión PostgreSQL.

- [x] **TASK-03: Regeneración de Migraciones EF Core para PostgreSQL**
  - Respaldadas migraciones antiguas de SQL Server en `odd/backups/Migrations_SqlServer_Backup`.
  - Generada migración nativa PostgreSQL: `20260925214902_InitialPostgreSql.cs` y snapshot del modelo.
  - Verificada generación limpia de DDL (`text`, `boolean`, `timestamp without time zone`, claves foráneas).

- [x] **TASK-04: Orquestación y Blueprint de Despliegue en Render (`render.yaml`)**
  - Creado `render.yaml` con la especificación completa de microservicios:
    - `vetcare-api`: Web Service Docker (`src/Backend/Dockerfile`, puerto 8080).
    - `vetcare-frontend`: Static Site (`src/Frontend`, Vite build con rewrites SPA).
  - Corregido `outDir` en `vite.config.ts` para soportar tanto `dist/` para Render Static Site como exportación a `wwwroot`.

- [x] **TASK-05: Verificación, Build y Guía Operativa de Conexión**
  - Compilación de Backend: Correcta (0 errores).
  - Compilación de Frontend: Correcta (Vite bundle generado exitosamente en `dist/`).
  - Suite de pruebas unitarias: **298/298 tests superados (100% éxito)**.
