---
name: frontend
display: Frontend / UI / componentes/vistas
description: Cuando trabajes en frontend (React, componentes, vistas)
---

# VetCare Frontend — AI Agent Ruleset

> **Skills Reference**:
> <!-- SKILLS_REF_START -->
> - [agent-creator](../skills/agent-creator/SKILL.md) - Crea nuevos sub-agentes para el orquestador principal de VetCare. Usar cuando necesites configurar una nueva especialidad para los agentes de IA.
> - [agent-sync](../skills/agent-sync/SKILL.md) - Sincroniza la tabla de sub-agentes y reglas de enrutamiento en AGENTS.md raíz. Usar siempre que agregues, elimines o cambies el nombre de un sub-agente.
> - [commits](../skills/commits/SKILL.md) - Conventional commits para VetCare. Formato correcto de mensajes de commit. Usar siempre antes de hacer un git commit.
> - [jwt-auth](../skills/jwt-auth/SKILL.md) - Patrón completo de autenticación JWT para VetCare. Generación en backend .NET, interceptor Axios en frontend, guards de rutas por rol. Usar cuando implementes login, rutas protegidas, middleware de auth o manejo de tokens.
> - [pull-request](../skills/pull-request/SKILL.md) - Convenciones de Pull Request para VetCare. Título, descripción, checklist y cómo revisar. Usar siempre antes de crear o revisar un PR.
> - [react-typescript](../skills/react-typescript/SKILL.md) - React + TypeScript sin código genérico. Componentes bien estructurados, tipos explícitos, sin any, servicios separados de la UI. Usar cuando toques cualquier archivo .tsx o .ts del frontend.
> - [vetcare-frontend-flow](../skills/vetcare-frontend-flow/SKILL.md) - Flujo de desarrollo paso a paso para importar pantallas de StitchMCP, convertirlas a React + TypeScript y conectarlas a la API de .NET.
> - [vetcare-ui](../skills/vetcare-ui/SKILL.md) - Componentes, vistas y estructura del frontend de VetCare. Diseño profesional no genérico, conexión con API, estructura por rol. Usar cuando crees o modifiques cualquier componente o vista del frontend.
<!-- SKILLS_REF_END -->

## Auto-invoke Skills

<!-- AUTO_INVOKE_START -->
| Acción | Skill |
|---|---|
| Crear o modificar un componente React | `react-typescript` |
| Crear o modificar una vista (página completa) | `vetcare-ui` |
| Crear types o interfaces TypeScript | `react-typescript` |
| Crear un nuevo sub-agente | `agent-creator` |
| Crear un Pull Request | `pull-request` |
| Hacer un commit | `commits` |
| Modificar o agregar un sub-agente | `agent-sync` |
| Trabajar con Axios, interceptores, token JWT | `jwt-auth` |
| Trabajar en el portal del cliente | `vetcare-ui` |
<!-- AUTO_INVOKE_END -->

## CRITICAL RULES — NON-NEGOTIABLE

### React + TypeScript
- ALWAYS: `import { useState, useEffect } from "react"`
- NEVER: `import React` o `import * as React`
- ALWAYS: Tipos explícitos en props, nunca `any`
- ALWAYS: Interfaces de una sola profundidad (objeto anidado → interfaz separada)

### Componentes
- ALWAYS: Componentes atómicos reutilizables en `components/`
- ALWAYS: Vistas completas de negocio en `views/`
- NEVER: Lógica de negocio dentro de un componente visual
- NEVER: Llamadas a la API directamente desde un componente (usar `services/`)

### Axios y JWT
- ALWAYS: Usar la instancia centralizada de Axios (`services/api.ts`)
- ALWAYS: El interceptor inyecta el token automáticamente
- NEVER: Escribir `Authorization: Bearer` manualmente en cada llamada
- NEVER: Guardar el token completo en localStorage sin cifrar

### Estilos
- NEVER: Estilos inline para layout estructural
- NEVER: UI que parezca genérica de IA (usar `vetcare-ui` skill)

## Decision Trees

### ¿Dónde va este código?
```text
¿Es un botón, input, modal reutilizable? → components/
¿Es una pantalla completa del negocio?   → views/
¿Hace petición HTTP?                     → services/
¿Es un tipo o interfaz compartida?       → types/
¿Es un hook personalizado?               → hooks/
```

### ¿Qué rol puede ver esta vista?
```text
/portal-cliente     → Cliente
/agenda             → Recepcionista
/mi-agenda          → Veterinario
/dashboard          → Administrador
```

## Tech Stack

React | TypeScript | Axios | React Router | Vite

## Project Structure

```text
src/Frontend/
├── components/       → Botones, inputs, modales, cards reutilizables
├── views/            → FichaCliente, HistoriaClinica, Agenda, Login...
├── services/         → api.ts (instancia Axios + interceptor JWT)
│   ├── auth.service.ts
│   ├── citas.service.ts
│   ├── clientes.service.ts
│   └── mascotas.service.ts
├── types/            → Interfaces TypeScript compartidas
├── hooks/            → Custom hooks reutilizables
└── router/           → Rutas y guards por rol
```

## Commands

```bash
npm install && npm run dev
npm run build
npm run typecheck
npm run linter
```

## QA Checklist

- [ ] `npm run typecheck` sin errores
- [ ] `npm run lint` pasa
- [ ] Ningún componente llama a la API directamente
- [ ] Token JWT inyectado por interceptor, no manualmente
- [ ] Rutas protegidas por guard de rol
- [ ] UI no se ve genérica (validar con vetcare-ui skill)
- [ ] No hay `any` en el código

## Naming Conventions

| Entidad | Patrón | Ejemplo |
|---------|--------|---------|
| Componente | PascalCase | `CitaCard.tsx` |
| Vista | PascalCase + sufijo View | `AgendaView.tsx` |
| Servicio | camelCase + .service | `citas.service.ts` |
| Hook | use + PascalCase | `useCitas.ts` |
| Type/Interface | PascalCase | `CitaDto.ts` |
