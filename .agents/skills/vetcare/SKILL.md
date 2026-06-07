---
name: vetcare
description: Contexto general del sistema VetCare. Actores, módulos, stack, reglas globales y estructura del proyecto. Leer siempre al iniciar trabajo en cualquier parte del sistema.
---

## Qué es VetCare
Sistema de gestión de citas veterinarias para clínicas de 1 a 5 veterinarios.
Todo el sistema gira alrededor de la Cita: conecta al cliente, mascota,
veterinario, servicio, atención clínica y pago.

---

## Actores del sistema

| Actor | Panel | Ruta base |
|-------|-------|-----------|
| `Cliente` | Portal Cliente | `/portal-cliente` |
| `Recepcionista` | Panel Operativo | `/agenda` |
| `Veterinario` | Panel Veterinario | `/mi-agenda` |
| `Administrador` | Panel Admin | `/dashboard` |

---

## Módulos

| # | Módulo | Descripción |
|---|--------|-------------|
| 1 | Autenticación | Login, roles, gestión de usuarios internos |
| 2 | Clientes | Registro, búsqueda, ficha, inactivación |
| 3 | Mascotas | Ficha clínica, cambio de responsable, inactivación |
| 4 | Catálogo de Servicios | Servicios, duración, precio base |
| 5 | Agenda y Citas | Horarios, disponibilidad, ciclo de vida completo |
| 6 | Atención Clínica | Historia clínica, signos, diagnóstico, tratamiento |
| 7 | Pagos y Cobros | Registro de cobro, métodos, comprobante PDF |
| 8 | Notificaciones | Correo e internas para clientes y personal |
| 9 | Portal del Cliente | Auto-servicio: citas, historial, perfil |
| 10 | Reportes y Dashboard | Panel diario, reportes, estadísticas |

---

## Stack

| Capa | Tecnología |
|------|------------|
| Backend | .NET Core / C# — Onion Architecture |
| Base de datos | SQL Server + EF Core Code-First |
| Frontend | React + TypeScript + Axios |
| Auth | JWT Bearer — 8 horas de expiración |

---

## Entidades principales

| Entidad | Propósito |
|---------|-----------|
| `Usuario` | Cuenta de acceso con rol |
| `Cliente` | Dueño o responsable de mascotas |
| `Mascota` | Unidad clínica central del sistema |
| `Veterinario` | Profesional que atiende |
| `Servicio` | Catálogo de servicios ofrecidos |
| `Cita` | Eje operativo que conecta todo |
| `AtenciónClínica` | Registro médico de la consulta |
| `Pago` | Cobro vinculado a una cita completada |
| `HorarioClinica` | Horario general del establecimiento |
| `HorarioVeterinario` | Disponibilidad individual del veterinario |
| `BloqueoAgenda` | Tiempo bloqueado manualmente |
| `Notificación` | Avisos al cliente y personal |

---

## Reglas globales de negocio

### Eliminación
- ALWAYS: Eliminación lógica con campo `Activo = false`
- NEVER: DELETE físico si el registro tiene historial

### Auditoría
- ALWAYS: Registrar quién hizo el cambio, cuándo y qué cambió en acciones sensibles
- Aplica a: reprogramación de citas, cambio de responsable de mascota, anulación de pago

### Seguridad
- ALWAYS: Contraseñas con BCrypt hash. Nunca texto plano
- ALWAYS: El cliente solo puede ver sus propios datos
- NEVER: Exponer detalles técnicos en mensajes de error
- NEVER: Revelar si un correo existe en errores de login

### Datos
- ALWAYS: Un cliente puede tener múltiples mascotas
- ALWAYS: Una mascota debe tener obligatoriamente un cliente responsable
- ALWAYS: El historial clínico pertenece a la mascota, no al cliente
- NEVER: Eliminar un cliente si tiene mascotas o historial

### Roles y acceso
- Cliente → solo sus datos, solo citas con ≥ 2h de anticipación para cancelar
- Recepcionista → agenda operativa, no reportes financieros detallados
- Veterinario → solo su agenda y atenciones asignadas
- Administrador → acceso total

---

## Contexto de desarrollo
- Proyecto desde cero
- No hay código legacy que respetar
- Prioridad: calidad sobre velocidad
- Seguir skills específicas según la capa en la que se trabaje
