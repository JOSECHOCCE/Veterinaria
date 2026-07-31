# Changelog

Todos los cambios notables en el proyecto **VetCare Pro** serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/), y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-07-28

### Seguridad
- Eliminación de claves JWT e información sensible hardcodeada en el repositorio público.
- Implementación de `appsettings.Development.json` y `appsettings.Example.json`.
- Configuración de `ForwardedHeaders` para compatibilidad con AWS App Runner y proxies reversos.
- Forzado de redirección HTTPS para entornos de producción.

### Infraestructura & CI/CD
- Inclusión de `docker-compose.yml` para desarrollo local unificado con SQL Server 2022.
- Robustecimiento del pipeline GitHub Actions (`deploy.yml`): validación de Pull Requests, ejecución de linter, `npm ci` y etiquetado con SHA de commits.

### Documentación
- Creación de `README.md`, `SECURITY.md`, `LICENSE` y `.env.example`.
