# VetCare Pro — Sistema de Gestión Veterinaria Comercial

[![CI/CD Pipeline](https://github.com/JOSECHOCCE/Veterinaria/actions/workflows/deploy.yml/badge.svg)](https://github.com/JOSECHOCCE/Veterinaria/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![.NET 10](https://img.shields.io/badge/.NET-10.0-purple.svg)](https://dotnet.microsoft.com/)
[![React 19](https://img.shields.io/badge/React-19.0-blue.svg)](https://react.dev/)

**VetCare Pro** es una plataforma integral SaaS de gestión veterinaria diseñada para clínicas, hospitales y profesionales independientes. Ofrece control completo de historias clínicas, citas, inventario, ventas, triaje y portal del cliente.

---

## 🚀 Arquitectura del Proyecto

El proyecto está construido bajo los principios de Arquitectura Limpia (Clean Architecture) / Arquitectura Cebolla:

```
src/
├── Backend/
│   ├── Veterinaria.Domain/         # Entidades del negocio y contratos
│   ├── Veterinaria.Application/    # Servicios de aplicación y casos de uso
│   ├── Veterinaria.Infrastructure/ # EF Core, Data Seeder, Repositorios
│   ├── Veterinaria.Web/            # ASP.NET Core Web API, Controllers, SignalR Hubs
│   ├── Veterinaria.Tests/          # Pruebas unitarias backend
│   └── Veterinaria.Tests.Integration/ # Pruebas de integración
└── Frontend/                       # React 19 + TypeScript + Vite + TailwindCSS
```

---

## 🛠️ Requisitos Previos

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/) (para ejecución containerizada)
- SQL Server (opcional si se usa Docker Compose)

---

## ⚡ Inicio Rápido con Docker Compose

La forma más rápida de levantar todo el entorno de desarrollo (Base de Datos + API + Frontend):

```bash
# 1. Clonar repositorio
git clone https://github.com/JOSECHOCCE/Veterinaria.git
cd Veterinaria

# 2. Copiar archivo de variables de entorno
cp .env.example .env

# 3. Iniciar servicios
docker-compose up --build -d
```

Acceso:
- **API Swagger:** `http://localhost:8080/swagger`
- **Aplicación Web:** `http://localhost:8080`

---

## 💻 Desarrollo Local Manual

### Backend (.NET 10)

```bash
cd src/Backend
dotnet restore
dotnet run --project Veterinaria.Web
```

### Frontend (React + Vite)

```bash
cd src/Frontend
npm install
npm run dev
```

---

## 🧪 Pruebas y Calidad de Código

### Ejecutar pruebas backend

```bash
dotnet test src/Backend/Veterinaria.sln
```

### Ejecutar Linter y Pruebas Frontend

```bash
cd src/Frontend
npm run lint
npx playwright test
```

---

## ☁️ Despliegue CI/CD

El repositorio utiliza **GitHub Actions** (`.github/workflows/deploy.yml`):
- **Pull Requests:** Ejecuta compilación, pruebas unitarias y linter.
- **Push a `main`:** Construye la imagen Docker, la publica en **Amazon ECR** e inicia el despliegue automático en **AWS App Runner**.

---

## 🔐 Seguridad

Para reportar vulnerabilidades de seguridad, consulta [SECURITY.md](SECURITY.md).
