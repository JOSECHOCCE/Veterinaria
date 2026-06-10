---
name: agent-creator
description: Crea nuevos sub-agentes para el orquestador principal de VetCare. Usar cuando necesites configurar una nueva especialidad para los agentes de IA.
category: infra
agents: [backend, frontend, database, testing]
triggers:
  backend: "Crear un nuevo sub-agente"
  frontend: "Crear un nuevo sub-agente"
  database: "Crear un nuevo sub-agente"
  testing: "Crear un nuevo sub-agente"
---

## Cuándo crear un sub-agente

Crear un sub-agente cuando:
- Una nueva capa arquitectónica o dominio de especialización (por ejemplo, `testing`, `devops`, `mobile`) requiere un conjunto amplio de reglas de negocio específicas.
- Quieres definir un Tech Stack, QA Checklist y comandos particulares para un rol de desarrollo específico.

---

## Estructura de un sub-agente

```text
.agents/{nombre-agente}/
└── AGENTS.md        # Reglas e instrucciones del sub-agente (con frontmatter YAML)
```

---

## Pasos para crear un sub-agente nuevo

1. **Crear el directorio**: Crea la carpeta `.agents/{nombre-agente}/`.
2. **Copiar plantilla**: Copia el archivo plantilla `AGENTS-TEMPLATE.md` ubicado en `.agents/skills/agent-creator/assets/` a la nueva ruta como `AGENTS.md`.
3. **Rellenar frontmatter**: Define el `name`, `display` y `description`.
4. **Completar reglas**: Añade las reglas críticas, stack tecnológico, comandos, checklist de QA y convenciones del agente.
5. **Sincronizar**: Ejecuta la sincronización de agentes:
   ```bash
   node .agents/skills/agent-sync/scripts/agent-sync.js
   ```
6. **Sincronizar skills**: Ejecuta `node .agents/skills/skill-sync/scripts/sync.js` para mapear las skills del sistema al nuevo agente si corresponde.

---

## Checklist de creación

- [ ] El sub-agente se encuentra en la carpeta `.agents/{nombre-agente}/`.
- [ ] Tiene su archivo `AGENTS.md` con frontmatter YAML válido.
- [ ] Los comentarios `<!-- SKILLS_REF_START -->` y `<!-- AUTO_INVOKE_START -->` están presentes.
- [ ] Se ejecutaron los scripts de sincronización correctamente.
