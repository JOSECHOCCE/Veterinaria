# CONTEXTO GLOBAL — Leer antes de implementar cualquier feature

Antes de escribir cualquier código, el agente DEBE ejecutar este protocolo sin excepción.

---

## 1. Identificar el requerimiento exacto
Abrir `.ai-context/1-requerimientos_sistema_veterinario.md` y localizar el RF correspondiente.
Extraer: nombre oficial de entidades, actores involucrados, validaciones y reglas de negocio.
Si la tarea no mapea a un RF claro → preguntar antes de codificar.

## 2. Verificar el flujo UML
Abrir `.ai-context/flujos_uml_sistema_veterinaria.md` y encontrar el diagrama del flujo relacionado.
Respetar el orden exacto de mensajes del `sequenceDiagram`.
Respetar todas las transiciones del `stateDiagram-v2` de Cita — ninguna transición fuera de ese diagrama es válida.

## 3. No duplicar lo que ya existe
Antes de crear cualquier entidad, servicio, hook o vista, verificar si ya existe en el repo.
Si existe → extender o corregir. Nunca duplicar.

## 4. Cada archivo en su capa
Domain → entidades puras sin EF ni anotaciones
Application → DTOs, interfaces, servicios
Infrastructure → repositorios, EF Core, JWT
Web → controllers delgados sin lógica de negocio
Frontend views/ → vistas por módulo de negocio
Frontend hooks/ → toda lógica de datos
Frontend services/ → solo llamadas HTTP con Axios
Frontend components/ → componentes reutilizables sin lógica de negocio
