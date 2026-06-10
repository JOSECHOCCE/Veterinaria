# VetCare — Orquestador Principal

## Cómo usar este sistema
- Este archivo es el punto de entrada para cualquier agente de IA.
- Para trabajo específico por capa, leer el sub-agente correspondiente.
- Las skills se auto-invocan según la acción que estés realizando.
- Sub-agente docs tienen prioridad sobre este archivo si hay conflicto.

---

## Stack del Proyecto

| Capa | Tecnología |
|---|---|
| Backend | .NET Core / C# — Onion Architecture |
| Base datos | SQL Server + Entity Framework Core Code-First |
| Frontend | React + TypeScript + Axios |
| Auth | JWT con Request Interceptor en Axios |
| Testing | xUnit (backend) · Vitest + RTL (frontend) |

---

## Sub-agentes (leer según contexto)

<!-- SUBAGENTS_START -->
| Cuando trabajes en... | Leer |
|---|---|
| Backend / API / dominio / lógica | `.agents/backend/AGENTS.md` |
| Base de datos / migraciones / EF | `.agents/database/AGENTS.md` |
| Frontend / UI / componentes/vistas | `.agents/frontend/AGENTS.md` |
| Testing / xUnit / pruebas unitarias | `.agents/testing/AGENTS.md` |
<!-- SUBAGENTS_END -->

---

## Available Skills

### Skills Genéricas (cualquier proyecto)

<!-- SKILLS_GENERIC_START -->
| Skill | Descripción | URL |
|---|---|---|
| `clean-architecture` | Onion Architecture para .NET Core. Vigila que las dependencias fluyan correctamente entre capas. Usar cuando crees, muevas o reorganices clases entre Domain, Application, Infrastructure y Web. | [SKILL.md](.agents/skills/clean-architecture/SKILL.md) |
| `clean-architecture-review` | Review code and provide design guidance based on Clean Architecture principles. Checks dependency rule, layer separation, crossing boundaries, and SOLID principles. Use when asked to review architecture, check dependencies, or design with clean architecture principles. | [SKILL.md](.agents/skills/clean-architecture-review/SKILL.md) |
| `commits` | Conventional commits para VetCare. Formato correcto de mensajes de commit. Usar siempre antes de hacer un git commit. | [SKILL.md](.agents/skills/commits/SKILL.md) |
| `csharp-dotnet` | Patrones C# profesionales, naming conventions, estructura de código y buenas prácticas para proyectos .NET Core. Usar cuando escribas o refactorices cualquier archivo .cs. | [SKILL.md](.agents/skills/csharp-dotnet/SKILL.md) |
| `entity-framework` | Patrones de EF Core Code-First para VetCare. Fluent API obligatorio, migraciones bien nombradas, sin Data Annotations en Domain. Usar cuando toques DbContext, entidades, migraciones o configuraciones de base de datos. | [SKILL.md](.agents/skills/entity-framework/SKILL.md) |
| `jwt-auth` | Patrón completo de autenticación JWT para VetCare. Generación en backend .NET, interceptor Axios en frontend, guards de rutas por rol. Usar cuando implementes login, rutas protegidas, middleware de auth o manejo de tokens. | [SKILL.md](.agents/skills/jwt-auth/SKILL.md) |
| `pull-request` | Convenciones de Pull Request para VetCare. Título, descripción, checklist y cómo revisar. Usar siempre antes de crear o revisar un PR. | [SKILL.md](.agents/skills/pull-request/SKILL.md) |
| `react-typescript` | React + TypeScript sin código genérico. Componentes bien estructurados, tipos explícitos, sin any, servicios separados de la UI. Usar cuando toques cualquier archivo .tsx o .ts del frontend. | [SKILL.md](.agents/skills/react-typescript/SKILL.md) |
<!-- SKILLS_GENERIC_END -->

### Skills Específicas de VetCare

<!-- SKILLS_SPECIFIC_START -->
| Skill | Descripción | URL |
|---|---|---|
| `vetcare` | Contexto general del sistema VetCare. Actores, módulos, stack, reglas globales y estructura del proyecto. Leer siempre al iniciar trabajo en cualquier parte del sistema. | [SKILL.md](.agents/skills/vetcare/SKILL.md) |
| `vetcare-agenda` | Lógica completa de agenda y citas de VetCare. Estados, transiciones válidas, cálculo de disponibilidad, reglas de negocio. Usar cuando toques cualquier lógica relacionada con citas, horarios o disponibilidad. | [SKILL.md](.agents/skills/vetcare-agenda/SKILL.md) |
| `vetcare-api` | Endpoints, DTOs, controllers y contratos de la API REST de VetCare. Usar cuando crees o modifiques controllers, DTOs, servicios de Application o rutas del backend. | [SKILL.md](.agents/skills/vetcare-api/SKILL.md) |
| `vetcare-db` | Entidades, relaciones y configuraciones Fluent API específicas de VetCare. Usar cuando crees o modifiques entidades del Domain o configuraciones de Infrastructure. | [SKILL.md](.agents/skills/vetcare-db/SKILL.md) |
| `vetcare-frontend-flow` | Flujo de desarrollo paso a paso para importar pantallas de StitchMCP, convertirlas a React + TypeScript y conectarlas a la API de .NET. | [SKILL.md](.agents/skills/vetcare-frontend-flow/SKILL.md) |
| `vetcare-ui` | Componentes, vistas y estructura del frontend de VetCare. Diseño profesional no genérico, conexión con API, estructura por rol. Usar cuando crees o modifiques cualquier componente o vista del frontend. | [SKILL.md](.agents/skills/vetcare-ui/SKILL.md) |
<!-- SKILLS_SPECIFIC_END -->

### Skills de Infraestructura del Sistema de Agentes

<!-- SKILLS_INFRA_START -->
| Skill | Descripción | URL |
|---|---|---|
| `agent-creator` | Crea nuevos sub-agentes para el orquestador principal de VetCare. Usar cuando necesites configurar una nueva especialidad para los agentes de IA. | [SKILL.md](.agents/skills/agent-creator/SKILL.md) |
| `agent-sync` | Sincroniza la tabla de sub-agentes y reglas de enrutamiento en AGENTS.md raíz. Usar siempre que agregues, elimines o cambies el nombre de un sub-agente. | [SKILL.md](.agents/skills/agent-sync/SKILL.md) |
| `skill-creator` | Crea nuevas skills para el sistema de agentes de VetCare siguiendo el estándar de Antigravity. Usar cuando pidas crear una nueva skill, agregar instrucciones al agente o documentar patrones para IA. | [SKILL.md](.agents/skills/skill-creator/SKILL.md) |
| `skill-sync` | Sincroniza las skills en AGENTS.md cuando agregas, modificas o eliminas una skill. Usar siempre que hagas cualquier cambio en la carpeta .agents/skills/. | [SKILL.md](.agents/skills/skill-sync/SKILL.md) |
<!-- SKILLS_INFRA_END -->

---

## Auto-invoke Skills

> ⚠️ Cuando realices alguna de estas acciones, DEBES invocar
> la skill correspondiente ANTES de escribir cualquier código.

| Acción | Skill |
|---|---|
| Hacer un commit | `commits` |
| Crear o revisar un Pull Request | `pull-request` |
| Crear una nueva skill | `skill-creator` |
| Modificar o agregar una skill | `skill-sync` |
<!-- SUBAGENT_DISPATCH_START -->
| Cuando trabajes en backend (.NET, controllers, services) | → ver `.agents/backend/AGENTS.md` |
| Cuando trabajes en base de datos (EF, migraciones, seeds) | → ver `.agents/database/AGENTS.md` |
| Cuando trabajes en frontend (React, componentes, vistas) | → ver `.agents/frontend/AGENTS.md` |
| Cuando trabajes en pruebas unitarias, tests de integración o xUnit | → ver `.agents/testing/AGENTS.md` |
<!-- SUBAGENT_DISPATCH_END -->

---

## Convenciones Globales

- Eliminación siempre **lógica** (campo `Activo`), nunca física si hay historial.
- Toda acción sensible guarda auditoría: quién, cuándo y qué cambió.
- Los errores nunca exponen detalles técnicos al cliente.
- Las contraseñas siempre con hash seguro, nunca en texto plano.
