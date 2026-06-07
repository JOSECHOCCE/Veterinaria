---
name: pull-request
description: Convenciones de Pull Request para VetCare. Título, descripción, checklist y cómo revisar. Usar siempre antes de crear o revisar un PR.
category: generic
agents: [backend, frontend]
triggers:
  backend: "Crear un Pull Request"
  frontend: "Crear un Pull Request"
---

## Cuándo usar esta skill
- Antes de crear un Pull Request
- Al revisar un PR de otro desarrollador
- Al completar una feature o fix

---

## Título del PR (REQUIRED)

Mismo formato que conventional commits:

```text
<tipo>[scope]: <descripción corta>

feat(citas): implementar cálculo de bloques disponibles
fix(auth): corregir guard de ruta para rol Recepcionista
refactor(mascotas): separar lógica de cambio de responsable
```

---

## Plantilla de descripción (REQUIRED)

```markdown
## ¿Qué hace este PR?
<!-- Descripción clara del cambio. Qué problema resuelve o qué agrega. -->

## Cambios realizados
- [ ] Capa afectada: Domain / Application / Infrastructure / Web / Frontend
- Lista concreta de cambios

## Cómo probarlo
1. Paso 1
2. Paso 2
3. Resultado esperado

## Checklist
- [ ] `dotnet build` sin warnings (backend)
- [ ] `dotnet test` pasa (backend)
- [ ] `npm run typecheck` pasa (frontend)
- [ ] `npm run lint` pasa (frontend)
- [ ] No hay lógica de negocio en Controllers
- [ ] Eliminación es lógica, no física
- [ ] Rutas protegidas con `[Authorize]`
- [ ] No hay `any` en TypeScript
- [ ] UI no se ve genérica
- [ ] Sin secretos o credenciales en el código

## Screenshots (si aplica)
<!-- Para cambios de UI, adjuntar antes/después -->
```

---

## Reglas del reviewer (REQUIRED)

- ALWAYS: Revisar que las dependencias respetan Onion Architecture
- ALWAYS: Verificar que no hay lógica de negocio en Controllers
- ALWAYS: Confirmar que eliminaciones son lógicas
- ALWAYS: Rechazar si hay `any` en TypeScript
- NEVER: Aprobar un PR sin que los checks pasen
- NEVER: Aprobar un PR con credenciales o tokens hardcodeados

---

## Tamaño del PR (RECOMENDADO)

| Tamaño | Líneas cambiadas | Acción |
|--------|-----------------|--------|
| Pequeño ✅ | < 200 líneas | Ideal, revisar rápido |
| Mediano ⚠️ | 200 - 500 líneas | Aceptable, revisar con cuidado |
| Grande ❌ | > 500 líneas | Dividir en PRs más pequeños |

---

## Ramas (RECOMENDADO)

```text
main              ← producción estable
develop           ← integración
feature/citas-disponibilidad   ← nueva funcionalidad
fix/auth-redirect-veterinario  ← corrección de bug
refactor/mascota-inactivacion  ← refactorización
chore/migracion-pagos          ← mantenimiento
```

