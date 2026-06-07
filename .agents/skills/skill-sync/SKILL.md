---
name: skill-sync
description: Sincroniza las skills en AGENTS.md cuando agregas, modificas o eliminas una skill. Usar siempre que hagas cualquier cambio en la carpeta .agents/skills/.
---

## Cuándo usar esta skill
- Agregaste una nueva skill (nueva carpeta + SKILL.md)
- Eliminaste una skill existente
- Cambiaste el nombre o descripción de una skill
- Moviste una skill de genérica a específica o viceversa

---

## Proceso de sincronización (AUTOMATIZADO)

El sistema de sincronización es completamente automático mediante un script de Node.js en [sync.js](file:///c:/Users/yaran/Documents/antigravity/Veterinaria-main/.agents/skills/skill-sync/scripts/sync.js).

### ¿Cómo funciona la automatización?
1. **Git pre-commit Hook**: Se ha configurado un archivo `pre-commit` en `.git/hooks/` que ejecuta el script antes de realizar cualquier commit.
2. **Auto-staging**: El hook añade automáticamente las modificaciones en los archivos `AGENTS.md` a la zona de preparación (staging) de Git.

### Ejecución Manual
Si necesitas forzar la sincronización en cualquier momento, ejecuta:
```bash
node .agents/skills/skill-sync/scripts/sync.js
```

---

## Metadatos Opcionales de Frontmatter
El script lee la parte superior de cada `SKILL.md` (YAML). Puedes añadir los siguientes campos opcionales para personalizar la sincronización:

```yaml
---
name: nombre-skill
description: descripción breve
category: generic | specific | infra   # Si no se define, se infiere del nombre
agents: [backend, frontend, database] # Sub-agentes donde aparecerá referenciada
---
```

Si no los defines, el script usará reglas predeterminadas basadas en el nombre de la skill.

---

## Tablas que se mantienen sincronizadas automáticamente

| Archivo | Sección |
|---------|---------|
| `AGENTS.md` raíz | `Available Skills` → Skills Genéricas |
| `AGENTS.md` raíz | `Available Skills` → Skills VetCare |
| `AGENTS.md` raíz | `Available Skills` → Skills Infra |
| `.agents/backend/AGENTS.md` | `Skills Reference` |
| `.agents/frontend/AGENTS.md` | `Skills Reference` |
| `.agents/database/AGENTS.md` | `Skills Reference` |

---

## Checklist de verificación

- [ ] Todas las skills tienen el frontmatter (YAML) correctamente formado
- [ ] No existen links rotos hacia archivos `SKILL.md`
- [ ] El script finaliza correctamente sin warnings en la terminal