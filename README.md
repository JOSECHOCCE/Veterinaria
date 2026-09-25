# VetCare Pro — Plataforma SaaS de Gestión Veterinaria Comercial

[![CI/CD Pipeline](https://github.com/JOSECHOCCE/Veterinaria/actions/workflows/deploy.yml/badge.svg)](https://github.com/JOSECHOCCE/Veterinaria/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![.NET 10](https://img.shields.io/badge/.NET-10.0-purple.svg)](https://dotnet.microsoft.com/)
[![React 19](https://img.shields.io/badge/React-19.0-blue.svg)](https://react.dev/)
[![Docker](https://img.shields.io/badge/Docker-Compose_Ready-2496ED.svg)](https://www.docker.com/)

**VetCare Pro** es una plataforma SaaS integral de gestión clínica y comercial veterinaria diseñada para clínicas, hospitales veterinarios y profesionales independientes. Ofrece control completo de historias clínicas (SOAP), triaje en tiempo real, agendamiento operativo, botica e inventario Kardex con trazabilidad de lotes, punto de venta (POS) y cobranza multimedio, reportes financieros y respaldos automáticos de seguridad.

---

## 🚀 Arquitectura del Sistema (Clean Architecture / Onion Architecture)

El proyecto implementa la arquitectura limpia modular en .NET 10 y React 19:

```
src/
├── Backend/
│   ├── Veterinaria.Domain/         # Entidades de negocio, contratos e interfaces core
│   ├── Veterinaria.Application/    # Casos de uso, servicios de aplicación, DTOs y validaciones
│   ├── Veterinaria.Infrastructure/ # EF Core 10, DbContext, repositorios y Unit of Work
│   ├── Veterinaria.Web/            # ASP.NET Core 10 Web API, Controllers, SignalR y Hosted Services
│   └── Veterinaria.Tests/          # Pruebas unitarias y de concurrencia multihilo (xUnit)
├── Frontend/                       # React 19 + TypeScript + Vite + TailwindCSS v4 + Nginx
├── scripts/                        # Scripts de desastre/restauración de base de datos (restore-db.sh)
├── docker-compose.prod.yml         # Orquestación de contenedores en producción
└── openspec/                       # Especificaciones vivas OpenSpec (Catálogo y Deltas)
```

---

## 🛡️ Los 6 Pilares SaaS de VetCare Pro

1. **Multi-Tenancy**: Aislamiento lógico multi-clínica mediante filtros globales en EF Core.
2. **Suscripciones**: Gestión de planes de cobro recurrente para clínicas cliente.
3. **Facturación Electrónica**: Emisión de comprobantes (Boleta, Factura, Ticket POS) y cierres de caja diarios (`CierreCaja`).
4. **Inventario & Botica**: Kardex valorizado automatizado, alertas de stock mínimo y control de vencimientos.
5. **WhatsApp & UX Mobile Responsive**: Interfaz adaptativa touch-friendly para tablets/smartphones en sala de atención y recordatorios automáticos.
6. **Seguridad, Auditoría y Backups**: Logs de auditoría médica (`AuditoriaLog`), anonimización de datos y servicio automatizado de respaldo diario (`DatabaseBackupService`).

---

## ⚡ Despliegue Rápido en Producción (Docker Compose)

Levanta la plataforma completa (Base de Datos + API .NET 10 + Nginx SPA) con un solo comando:

```bash
# 1. Clonar el repositorio
git clone https://github.com/JOSECHOCCE/Veterinaria.git
cd Veterinaria

# 2. Iniciar el entorno de producción containerizado
docker compose -f docker-compose.prod.yml up --build -d
```

### Accesos:
- **Frontend SPA (Nginx):** `http://localhost` (Puerto 80)
- **API Swagger Backend:** `http://localhost:8080/swagger` (Puerto 8080)

---

## 💾 Respaldo y Restauración de Base de Datos

### Respaldo Automático
El backend ejecuta `DatabaseBackupService` automáticamente cada 24 horas, generando volcados en `./backups` y eliminando archivos con más de 30 días de antigüedad.

### Trigger Manual vía API
Administradores pueden solicitar un respaldo inmediato mediante:
- `POST http://localhost:8080/api/backup/trigger`
- `GET http://localhost:8080/api/backup` (Lista de respaldos)
- `GET http://localhost:8080/api/backup/download/{filename}` (Descarga segura)

### Restauración en Desastres (Disaster Recovery)
```bash
chmod +x scripts/restore-db.sh
./scripts/restore-db.sh <nombre_archivo_backup.sql>
```

---

## 💻 Desarrollo Local Manual

### Backend (.NET 10 API)
```bash
cd src/Backend
dotnet restore
dotnet run --project Veterinaria.Web
```

### Frontend (React 19 + Vite)
```bash
cd src/Frontend
npm install
npm run dev
```

---

## 🧪 Pruebas Unitarias y Concurrencia

Ejecutar la suite completa de pruebas unitarias y de estrés multihilo (`ConcurrencyStockPaymentTests.cs`):

```bash
dotnet test src/Backend/Veterinaria.Tests/Veterinaria.Tests.Unitarias.csproj
```

---

## 🔐 Licencia y Seguridad

Licencia [MIT](LICENSE). Reporte de vulnerabilidades disponible en [SECURITY.md](SECURITY.md).
