---
name: {nombre-skill}
description: {Descripción breve de qué hace esta skill}. Usar cuando {condición específica de cuándo activarse}.
category: {generic | specific | infra} # Opcional: el script lo infiere por defecto
agents: [{backend | frontend | database}] # Opcional: el script lo infiere por defecto
---

## Cuándo usar esta skill
- {Condición 1}
- {Condición 2}
- {Condición 3}

---

## {Patrón Principal}

- ALWAYS: {regla obligatoria}
- ALWAYS: {regla obligatoria}
- NEVER: {regla prohibida}
- NEVER: {regla prohibida}

```{lenguaje}
// ✅ CORRECTO
{ejemplo correcto}

// ❌ NEVER
{ejemplo incorrecto}
```

---

## {Patrón Secundario}

- ALWAYS: {regla}
- NEVER: {regla}

```{lenguaje}
// ✅ CORRECTO
{ejemplo}
```

---

## Decision Tree (si aplica)

```text
¿{Pregunta 1}?  → {Acción A}
¿{Pregunta 2}?  → {Acción B}
Por defecto     → {Acción default}
```

---

## Checklist antes de hacer commit

- [ ] {verificación 1}
- [ ] {verificación 2}
- [ ] {verificación 3}