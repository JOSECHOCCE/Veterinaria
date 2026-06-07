---
name: commits
description: Conventional commits para VetCare. Formato correcto de mensajes de commit. Usar siempre antes de hacer un git commit.
category: generic
agents: [backend, frontend, database]
triggers:
  backend: "Hacer un commit"
  frontend: "Hacer un commit"
  database: "Hacer un commit"
---

## Cuándo usar esta skill
- Antes de ejecutar `git commit`
- Al revisar el historial de commits
- Al preparar un PR

---

## Formato (REQUIRED)

```text
<tipo>[scope opcional]: <descripción corta en imperativo>

[cuerpo opcional — explica el QUÉ y el POR QUÉ, no el cómo]

[footer opcional — referencias a issues]
```

---

## Tipos permitidos

| Tipo | Cuándo usarlo |
|------|---------------|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `refactor` | Refactorización sin cambio de comportamiento |
| `chore` | Tareas de mantenimiento, dependencias, config |
| `docs` | Solo documentación |
| `test` | Agregar o corregir tests |
| `style` | Formato, espacios, comas (sin cambio de lógica) |
| `perf` | Mejora de rendimiento |
| `ci` | Cambios en pipelines CI/CD |

---

## Scopes del proyecto VetCare

| Scope | Aplica a |
|-------|----------|
| `auth` | Autenticación y autorización |
| `citas` | Módulo de agenda y citas |
| `clientes` | Gestión de clientes |
| `mascotas` | Gestión de mascotas |
| `atencion` | Atención clínica |
| `pagos` | Pagos y cobros |
| `notificaciones` | Módulo de notificaciones |
| `reportes` | Dashboard y reportes |
| `portal` | Portal del cliente |
| `db` | Migraciones y base de datos |
| `ui` | Componentes y vistas del frontend |
| `infra` | Configuración, DI, Program.cs |

---

## Ejemplos correctos

```text
feat(citas): agregar reserva temporal de 5 minutos al seleccionar bloque

fix(auth): corregir redirección de rol Veterinario al iniciar sesión

refactor(mascotas): extraer lógica de inactivación a MascotaApplication

chore(db): agregar migración CreatePagosTable

test(citas): agregar tests unitarios para transición de estados

docs(agents): actualizar AGENTS.md con nueva skill vetcare-agenda
```

---

## NEVER

```text
// ❌ Mensajes vagos
git commit -m "fix"
git commit -m "changes"
git commit -m "update"
git commit -m "wip"

// ❌ Pasado en lugar de imperativo
feat(citas): agregué la reserva temporal   ← NO
feat(citas): agregar la reserva temporal   ← ✅

// ❌ Mayúscula al inicio de la descripción
feat(citas): Agregar reserva temporal      ← NO
feat(citas): agregar reserva temporal      ← ✅
```

---

## Checklist antes de commitear

- [ ] Tipo correcto según el cambio
- [ ] Scope corresponde al módulo modificado
- [ ] Descripción en imperativo, minúscula, sin punto final
- [ ] Un commit = un propósito claro
- [ ] No mezclar refactor + feat en el mismo commit

