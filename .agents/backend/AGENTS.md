---
name: backend
display: Backend / API / dominio / lógica
description: Cuando trabajes en backend (.NET, controllers, services)
---

# VetCare Backend — AI Agent Ruleset

> **Skills Reference**: Para patrones detallados usar estas skills:
> <!-- SKILLS_REF_START -->
> - [agent-creator](../skills/agent-creator/SKILL.md) - Crea nuevos sub-agentes para el orquestador principal de VetCare. Usar cuando necesites configurar una nueva especialidad para los agentes de IA.
> - [agent-sync](../skills/agent-sync/SKILL.md) - Sincroniza la tabla de sub-agentes y reglas de enrutamiento en AGENTS.md raíz. Usar siempre que agregues, elimines o cambies el nombre de un sub-agente.
> - [clean-architecture](../skills/clean-architecture/SKILL.md) - Onion Architecture para .NET Core. Vigila que las dependencias fluyan correctamente entre capas. Usar cuando crees, muevas o reorganices clases entre Domain, Application, Infrastructure y Web.
> - [clean-architecture-review](../skills/clean-architecture-review/SKILL.md) - Review code and provide design guidance based on Clean Architecture principles. Checks dependency rule, layer separation, crossing boundaries, and SOLID principles. Use when asked to review architecture, check dependencies, or design with clean architecture principles.
> - [commits](../skills/commits/SKILL.md) - Conventional commits para VetCare. Formato correcto de mensajes de commit. Usar siempre antes de hacer un git commit.
> - [csharp-dotnet](../skills/csharp-dotnet/SKILL.md) - Patrones C# profesionales, naming conventions, estructura de código y buenas prácticas para proyectos .NET Core. Usar cuando escribas o refactorices cualquier archivo .cs.
> - [jwt-auth](../skills/jwt-auth/SKILL.md) - Patrón completo de autenticación JWT para VetCare. Generación en backend .NET, interceptor Axios en frontend, guards de rutas por rol. Usar cuando implementes login, rutas protegidas, middleware de auth o manejo de tokens.
> - [pull-request](../skills/pull-request/SKILL.md) - Convenciones de Pull Request para VetCare. Título, descripción, checklist y cómo revisar. Usar siempre antes de crear o revisar un PR.
> - [vetcare-agenda](../skills/vetcare-agenda/SKILL.md) - Lógica completa de agenda y citas de VetCare. Estados, transiciones válidas, cálculo de disponibilidad, reglas de negocio. Usar cuando toques cualquier lógica relacionada con citas, horarios o disponibilidad.
> - [vetcare-api](../skills/vetcare-api/SKILL.md) - Endpoints, DTOs, controllers y contratos de la API REST de VetCare. Usar cuando crees o modifiques controllers, DTOs, servicios de Application o rutas del backend.
<!-- SKILLS_REF_END -->

## Auto-invoke Skills

<!-- AUTO_INVOKE_START -->
| Acción | Skill |
|---|---|
| Crear DTOs de entrada o salida | `csharp-dotnet` |
| Crear o modificar un Controller | `vetcare-api` |
| Crear o modificar un Service (Application layer) | `clean-architecture` |
| Crear o modificar una Interface | `clean-architecture` |
| Crear un nuevo sub-agente | `agent-creator` |
| Crear un Pull Request | `pull-request` |
| Hacer un commit | `commits` |
| Implementar autenticación, roles, JWT | `jwt-auth` |
| Modificar o agregar un sub-agente | `agent-sync` |
| Trabajar con lógica de citas, estados, disponibilidad | `vetcare-agenda` |
<!-- AUTO_INVOKE_END -->

## CRITICAL RULES — NON-NEGOTIABLE

### Onion Architecture
- ALWAYS: Dependencias apuntan hacia adentro (Web → Application → Domain)
- ALWAYS: Domain no depende de NADA externo (sin EF, sin ASP.NET)
- NEVER: Lógica de negocio en Controllers
- NEVER: Acceso directo a DbContext fuera de Infrastructure

### Controllers
- ALWAYS: Reciben JSON → llaman Application layer → devuelven `Response<T>`
- ALWAYS: Decorar con `[Authorize(Roles = "...")]` en rutas protegidas
- NEVER: Queries directas a la base de datos desde un Controller

### Services (Application Layer)
- ALWAYS: Reciben DTOs, devuelven DTOs
- ALWAYS: Validar con Validators antes de ejecutar lógica
- NEVER: Devolver entidades del Domain directamente al Controller

### Seguridad
- ALWAYS: Contraseñas con hash (BCrypt). Nunca texto plano
- ALWAYS: Validar rol antes de ejecutar acción sensible
- NEVER: Exponer mensajes de error técnicos al cliente
- NEVER: Revelar si un correo existe en errores de login

### Eliminación
- ALWAYS: Eliminación lógica con campo `Activo = false`
- NEVER: DELETE físico si el registro tiene historial

## Decision Trees

### ¿Dónde va esta lógica?
```text
¿Es una regla de negocio pura? → Domain/Entities
¿Orquesta un flujo de la app?  → Application/Services
¿Conecta con EF o servicios externos? → Infrastructure
¿Es un endpoint HTTP? → Web/Controllers
```

### ¿Qué tipo de respuesta devolver?
```text
Éxito con datos   → Response<T> con Data
Éxito sin datos   → Response<bool> con IsSuccess = true
Error de negocio  → Response<T> con IsSuccess = false + Message
Error técnico     → Middleware global captura → respuesta genérica
```

## Tech Stack

ASP.NET Core | C# | Entity Framework Core | SQL Server | JWT Bearer | BCrypt | xUnit

## Project Structure

```text
src/Backend/
├── VetCare.Domain/
│   ├── Entities/         → Usuario, Cliente, Mascota, Cita, Pago...
│   └── Interfaces/       → IUnitOfWork, IRepository<T>
├── VetCare.Application/
│   ├── DTOs/              → UsersDto, CitaCreateDto, PagoDto...
│   ├── Interfaces/       → IUsersApplication, ICitaApplication...
│   ├── Main/              → UsersApplication, CitaApplication...
│   └── Validators/       → Reglas de validación por entidad
├── VetCare.Infrastructure/
│   ├── Data/              → VetCareDbContext.cs
│   ├── Repositories/     → Implementaciones con EF + LINQ
│   └── Security/         → JwtGenerator, PasswordHasher
└── VetCare.Web/
    ├── Controllers/       → UsersController, CitasController...
    └── Middleware/        → GlobalExceptionHandler
```

## Commands

```bash
# Desarrollo
dotnet run --project src/Backend/VetCare.Web

# Migraciones
dotnet ef migrations add NombreMigracion --project VetCare.Infrastructure
dotnet ef database update --project VetCare.Infrastructure

# Testing
dotnet test
```

## QA Checklist

- [ ] `dotnet build` sin warnings
- [ ] `dotnet test` pasa
- [ ] Controller no tiene lógica de negocio
- [ ] DTOs usados en lugar de entidades de Domain
- [ ] Rutas protegidas tienen `[Authorize]`
- [ ] Eliminación es lógica, no física
- [ ] Errores no exponen detalles técnicos

## Naming Conventions

| Entidad | Patrón | Ejemplo |
|---------|--------|---------|
| Controller | `<Entidad>Controller` | `CitasController` |
| Service | `<Entidad>Application` | `CitaApplication` |
| Interface Service | `I<Entidad>Application` | `ICitaApplication` |
| Repository | `<Entidad>Repository` | `CitaRepository` |
| Interface Repo | `I<Entidad>Repository` | `ICitaRepository` |
| DTO entrada | `<Entidad>CreateDto` | `CitaCreateDto` |
| DTO salida | `<Entidad>Dto` | `CitaDto` |
| Validator | `<Entidad>Validator` | `CitaValidator` |
