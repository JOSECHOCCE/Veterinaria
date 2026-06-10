---
name: agent-sync
description: Sincroniza la tabla de sub-agentes y reglas de enrutamiento en AGENTS.md raíz. Usar siempre que agregues, elimines o cambies el nombre de un sub-agente.
category: infra
agents: [backend, frontend, database, testing]
triggers:
  backend: "Modificar o agregar un sub-agente"
  frontend: "Modificar o agregar un sub-agente"
  database: "Modificar o agregar un sub-agente"
  testing: "Modificar o agregar un sub-agente"
---

## Cuándo usar esta skill
- Creaste un nuevo sub-agente (directorio + AGENTS.md con frontmatter)
- Modificaste los datos del frontmatter de un sub-agente
- Eliminaste un sub-agente

---

## Proceso de sincronización

El sistema mantiene el orquestador principal alineado de forma semiautomática ejecutando el script en Node.js.

### Ejecución Manual
Para realizar la sincronización de los sub-agentes en cualquier momento:
```bash
node .agents/skills/agent-sync/scripts/agent-sync.js
```

---

## Metadatos de Frontmatter (Obligatorios en sub-agentes)
Cada archivo `.agents/{nombre-agente}/AGENTS.md` debe comenzar con un frontmatter YAML que contenga:

```yaml
---
name: backend                     # Identificador único (nombre del directorio)
display: Backend / API / dominio  # Texto a mostrar en la lista de sub-agentes
description: Cuando trabajes en backend (.NET, controllers, services) # Acción para el auto-invocador
---
```

---

## Secciones sincronizadas automáticamente
- El archivo `AGENTS.md` en la raíz se actualiza en las secciones:
  - `<!-- SUBAGENTS_START -->` ... `<!-- SUBAGENTS_END -->`
  - `<!-- SUBAGENT_DISPATCH_START -->` ... `<!-- SUBAGENT_DISPATCH_END -->`
