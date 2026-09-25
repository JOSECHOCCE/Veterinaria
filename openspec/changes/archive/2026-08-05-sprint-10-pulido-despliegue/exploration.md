# SDD Exploration: Sprint 10 — Pulido, Responsividad, Backup Automático y Despliegue Docker

## 1. Current State (Estado Actual)

- **Nombre del Cambio**: `sprint-10-pulido-despliegue`
- **Sprint**: Sprint 10 — Pulido, Hardening y Despliegue (Cierre de MVP SaaS **VetCare Pro**)
- **Dominio Clínico y Comercial**: Gestión integral veterinaria (Citas, Triaje/SOAP, Recetas, Botica/Inventario Kardex, POS/Cobro, Historia Clínica, Seguridad/Auditoría y Despliegue en Producción).
- **Cumplimiento de Protocolo SDD**: Basado en los acuerdos globales del proyecto (**Engram ID 76**), este documento realiza el cruce explícito de **Historias de Usuario (HU)**, **Requisitos Funcionales (RF)** y **Requisitos No Funcionales (RNF)** alineados a la realidad operativa de clínicas veterinarias.

---

## 2. Matriz de Trazabilidad Requisitos vs Historias de Usuario

| Código RF / RNF | Historia de Usuario | Descripción del Requisito Real Clínico | Cobertura en Sprint 10 | Estado Actual en Código |
|---|---|---|---|---|
| **RF-016 / RNF-011** | **HU-040** | **UI Responsive Adaptativa (Móvil, Tablet, Desktop)**:<br>Veterinarios y asistentes registran constantes vitales y consultan la historia clínica desde tablets/móviles al lado de la mascota. | Rediseño responsivo en TailwindCSS v4 de Triaje (`TriajeList.tsx`), Consulta SOAP (`ConsultaSOAP.tsx`), POS Botica (`POS.tsx`), Citas y Menú Lateral (`Sidebar.tsx`). | Parcial: Sidebar adaptado, falta refinamiento en tablas colapsables a `cards` y modales en pantallas móviles (< 768px). |
| **RF-017 / RNF-015** | **HU-041** | **Suite de Concurrencia y Pruebas de Estrés en Cobros e Inventario**:<br>Procesamiento simultáneo en horas pico sin *race conditions*, cobros dobles ni stock negativo en botica. | Adición de suite `ConcurrencyStockPaymentTests.cs` en `Veterinaria.Tests` ejecutando 15-20 hilos concurrentes simultáneos con `Task.WhenAll`. | 293 unit tests pasando. Falta la suite explícita de estrés/concurrencia multihilo. |
| **RF-018 / RNF-008** | **HU-042** | **Respaldo y Restauración Automática de Base de Datos**:<br>Resguardo diario obligatorio de datos médicos legales e historia clínica de pacientes. | Implementación de `DatabaseBackupService` como `IHostedService` en .NET 10 y script de recuperación ante desastres `scripts/restore-db.sh`. | No implementado en código. Requiere servicio en segundo plano + volúmenes persistentes. |
| **RF-019 / RNF-016** | **HU-043** | **Containerización Productiva con Docker Compose**:<br>Despliegue automatizado y reproducible en servidores locales de clínica o VPS en la nube en 1 comando. | Creación de `Dockerfile` para Frontend (Vite + Nginx Alpine), `docker-compose.prod.yml` con healthchecks, ssl y volúmenes persistentes. | Backend Dockerfile existe; falta Dockerfile Frontend Nginx y Compose productivo. |
| **DoD / Quality Gate** | **HU-044** | **Documentación Comercial y Manual de Despliegue**:<br>Guía completa de arquitectura, comandos de operación, capturas visuales y licencias. | Actualización completa del `README.md` comercial con insignias, diagramas C4/Clean Architecture y manual de producción. | README básico actual, requiere actualización integral final. |

---

## 3. Affected Areas (Áreas Afectadas)

### Frontend (React 19 + TypeScript + Vite + TailwindCSS v4 + Nginx)
- `src/Frontend/src/components/layout/Sidebar.tsx` — Navegación móvil con menú hamburguesa responsivo y drawer de superposición.
- `src/Frontend/src/views/Triaje/TriajeList.tsx` — Conversión de tabla horizontal a vista de tarjetas responsivas (`cards`) en pantallas < 768px.
- `src/Frontend/src/views/Ventas/POS.tsx` — Layout adaptable de catálogo de productos y carrito de compra flotante para tablets.
- `src/Frontend/src/views/AtencionMedica/ConsultaSOAP.tsx` — Disposición en rejilla responsiva (`grid-cols-1 md:grid-cols-2`) para formulario SOAP.
- `src/Frontend/Dockerfile` — [NUEVO] Multi-stage build con Node 22 (compilación) y `nginx:alpine` (runtime estático).
- `src/Frontend/nginx.conf` — [NUEVO] Configuración Nginx con fallback SPA (`try_files $uri /index.html`), compresión gzip y headers de seguridad.

### Backend (.NET 10 Clean Architecture)
- `src/Backend/Veterinaria.Application/Services/DatabaseBackupService.cs` — [NUEVO] `IHostedService` para ejecución de backups diarios automatizados (`.bak`/`.sql`).
- `src/Backend/Veterinaria.Web/Controllers/BackupController.cs` — [NUEVO] Endpoints de administración (`/api/backup/download`, `/api/backup/trigger`) para triggers manuales y descarga.
- `src/Backend/Veterinaria.Tests/Application/ConcurrencyStockPaymentTests.cs` — [NUEVO] Pruebas de estrés multihilo con 15-20 hilos simultáneos apuntando a pagos e inventario Kardex.

### Infraestructura & Despliegue
- `docker-compose.prod.yml` — [NUEVO] Orquestación de producción de servicios Frontend (Nginx), Backend (.NET 10 Web API) y Base de Datos (PostgreSQL/SQL Server) con volúmenes persistentes y healthchecks.
- `scripts/restore-db.sh` — [NUEVO] Script automatizado bash/powershell para restauración rápida de base de datos desde backup.
- `README.md` — Documentación comercial final, arquitectura y manual de despliegue productivo.

---

## 4. Approaches (Enfoques Evaluados)

### Opción A (Recomendada - Enfoque SaaS Integrado Nativo .NET + Nginx Docker)
- Implementar `DatabaseBackupService` nativo como `IHostedService` en ASP.NET Core 10 que gestione respaldos programados y bajo demanda con log de auditoría (`IAuditoriaService`).
- Frontend compilado en multi-stage build servido por `nginx:alpine` en el puerto 80/443 con optimizaciones SPA.
- Pruebas de concurrencia en C# utilizando `xUnit` + `Task.WhenAll` contra base de datos de prueba aislada por hilo.
- Refinamiento responsivo en TailwindCSS v4 mediante utilities semánticas (`hidden md:table`, `grid-cols-1 md:grid-cols-3`).
- **Pros**: Integración limpia sin acoplamiento a servicios externos pagados; despliegue inmediato con `docker compose -f docker-compose.prod.yml up -d`; resguardo auditado de BD.
- **Cons**: Requiere configuración precisa de permisos y volúmenes montados en Docker (`/app/backups`).
- **Effort**: Medium

### Opción B (Enfoque Cron Script Externo Linux + Nginx Host)
- Delegar respaldos a un servicio de sistema Operativo `cron` en Linux y servir el frontend directamente desde un Nginx instalado en el host fuera de Docker.
- **Pros**: Separa completamente el proceso de backup del proceso ASP.NET Core.
- **Cons**: Rompe la portabilidad del contenedor, complica la instalación en servidores Windows/Docker Desktop y no permite administrar/descargar respaldos desde el panel administrativo de la veterinaria.
- **Effort**: High

---

## 5. Recommendation (Recomendación)

Se aprueba la **Opción A**, por estar alineada a la Clean Architecture del proyecto, ofrecer máxima portabilidad SaaS, garantizar la trazabilidad de auditoría de los respaldos y brindar una experiencia responsive fluida tanto para recepcionistas como para médicos veterinarios.

---

## 6. Risks & Mitigations (Riesgos y Mitigaciones)

- **Riesgo 1 (Concurrencia en pruebas in-memory DB)**: SQLite in-memory o InMemoryProvider de EF Core no simulan bloqueos relacionales de fila (*row locking*) exactamente como SQL Server/PostgreSQL.
  - *Mitigación*: Diseñar `ConcurrencyStockPaymentTests.cs` utilizando un proveedor SQL Server/PostgreSQL de pruebas o conexiones transaccionales concurrentes explícitas con DbContext aislados por hilo.
- **Riesgo 2 (Volumen de Backups en Servidores Pequeños)**: La acumulación ilimitada de respaldos diarios puede llenar el disco del servidor.
  - *Mitigación*: Implementar retención automática de respaldos en `DatabaseBackupService` (eliminar respaldos mayores a 30 días automáticamente).

---

## 7. Ready for Proposal

- **Estado**: ✅ **Sí (Listo para `sdd-propose`)**.
- **Acción sugerida para la siguiente fase**: El usuario debe confirmar esta exploración para proceder a **`sdd-propose`** e iniciar la generación del delta `proposal.md` para el Sprint 10.
