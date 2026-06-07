---
name: skill-creator
description: Crea nuevas skills para el sistema de agentes de VetCare siguiendo el estándar de Antigravity. Usar cuando pidas crear una nueva skill, agregar instrucciones al agente o documentar patrones para IA.
---

## Cuándo crear una skill

Crear una skill cuando:
- Un patrón se repite y el agente necesita guía específica
- Las convenciones del proyecto difieren de las buenas prácticas genéricas
- Un flujo complejo necesita instrucciones paso a paso
- Un árbol de decisiones ayuda al agente a elegir el enfoque correcto

**No crear una skill cuando:**
- El patrón es trivial o autoexplicativo
- Es una tarea de una sola vez
- Ya existe una skill que cubre ese caso

---

## Estructura de una skill

```text
.agents/skills/{nombre-skill}/
├── SKILL.md              # Obligatorio — archivo principal
├── assets/               # Opcional — plantillas, esquemas, ejemplos
│   └── SKILL-TEMPLATE.md # Plantilla base reutilizable
└── references/           # Opcional — docs locales de referencia
    └── docs.md
```

---

## Pasos para crear una skill nueva

1. Verificar que no existe ya: revisar `.agents/skills/`
2. Decidir si es genérica o específica de VetCare (ver Decision Tree)
3. Crear carpeta: `.agents/skills/{nombre}/`
4. Crear `SKILL.md` usando la plantilla en `assets/SKILL-TEMPLATE.md`
5. Configurar los metadatos `category` y `agents` en el frontmatter del `SKILL.md` si es necesario (el script los infiere de forma predeterminada).
6. El script automático de sincronización se ejecutará en el siguiente commit y actualizará root `AGENTS.md` y las referencias en los sub-agentes.
7. Opcional: Ejecutar `node .agents/skills/skill-sync/scripts/sync.js` para ver los cambios inmediatamente sin hacer commit.

---

## Decision Tree: ¿qué tipo de skill crear?

```text
¿El patrón aplica a cualquier proyecto .NET?    → skill genérica (ej: csharp-dotnet)
¿El patrón aplica a cualquier proyecto React?   → skill genérica (ej: react-typescript)
¿El patrón es específico de VetCare?            → skill vetcare-{modulo}
¿Es infraestructura del sistema de agentes?     → skill de infra (ej: skill-sync)
```

---

## Decision Tree: ¿assets/ o references/?

```text
¿Necesitas plantillas de código reutilizables?  → assets/
¿Necesitas esquemas JSON?                       → assets/
¿Apuntas a documentación local existente?       → references/
```

**Regla clave:** `references/` apunta SIEMPRE a archivos locales, nunca a URLs externas.

---

## Naming Conventions

| Tipo | Patrón | Ejemplos |
|------|--------|----------|
| Tecnología genérica | `{tecnologia}` | `csharp-dotnet`, `react-typescript` |
| Específica VetCare | `vetcare-{modulo}` | `vetcare-agenda`, `vetcare-ui` |
| Testing | `testing-{tecnologia}` | `testing-dotnet`, `testing-react` |
| Workflow / Infra | `{accion}-{objetivo}` | `skill-creator`, `skill-sync` |

---

## Registrar la skill en AGENTS.md (REQUIRED)

Después de crear la skill, agregarla a la tabla correspondiente en `AGENTS.md`:

```markdown
| `nombre-skill` | Descripción breve | [SKILL.md](.agents/skills/nombre-skill/SKILL.md) |
```

Y si aplica a un sub-agente, agregar en su `Skills Reference`:
```markdown
> - [`nombre-skill`](../skills/nombre-skill/SKILL.md) - Descripción breve
```

---

## Checklist antes de crear

- [ ] No existe ya una skill similar en `.agents/skills/`
- [ ] El patrón es reutilizable, no es una tarea de una vez
- [ ] Nombre sigue las naming conventions
- [ ] Frontmatter solo tiene `name` y `description`
- [ ] Descripción incluye cuándo activarse (trigger)
- [ ] Patrones críticos son claros con ALWAYS/NEVER
- [ ] Hay ejemplos de código mínimos y enfocados
- [ ] Skill agregada al `AGENTS.md` raíz
- [ ] Ejecutar `skill-sync` al terminar

