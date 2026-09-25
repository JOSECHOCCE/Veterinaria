# Specification: Sprint 1 — Agenda y Gestión de Espacios Físicos (Consultorios)

- **Domain**: `agenda-consultorios`
- **Change Name**: `sprint-1-agenda-consultorios`
- **Target Stories**: `HU-001`, `HU-002`, `HU-021` a `HU-029`

---

## 1. NEW Requirements

### Requirement: EspacioFisico / Consultorio Model (`HU-026`, `RF-086`)
El sistema debe soportar un catálogo administrable de espacios físicos reservables para la clínica veterinaria.

#### Scenario: Creación y configuración de consultorios por defecto
- **Given** una clínica recién configurada
- **When** se ejecuta la inicialización de base de datos (`DbSeeder`)
- **Then** se deben crear los 4 espacios físicos por defecto:
  - `Consultorio 1` (Tipo: Consultorio)
  - `Consultorio 2` (Tipo: Consultorio)
  - `Sala de Procedimientos` (Tipo: SalaProcedimientos)
  - `Área de Grooming` (Tipo: AreaGrooming)

#### Scenario: Administración de espacios por el Administrador
- **Given** un usuario autenticado con el rol `Admin`
- **When** realiza peticiones HTTP a `/api/consultorios` (GET, POST, PUT, DELETE)
- **Then** el sistema permite crear, editar, listar y desactivar espacios físicos
- **And** si un usuario no-Admin intenta modificar consultorios, el sistema retorna `403 Forbidden`

---

### Requirement: Asignación Automática de Espacio Físico por Servicio (`HU-027`, `RF-083`, `RF-084`)
Al agendar o crear una cita médica o servicio, el sistema debe asignar automáticamente un consultorio o sala compatible que se encuentre disponible.

#### Scenario: Cita de consulta médica estándar
- **Given** un servicio de "Consulta General" o "Vacunación"
- **When** el recepcionista o cliente crea una cita a las 10:00 AM
- **Then** el sistema busca un espacio de tipo `Consultorio` sin citas agendadas entre 10:00 AM y 10:20 AM
- **And** asigna el `ConsultorioId` libre a la nueva cita

#### Scenario: Cita de procedimiento quirúrgico u odontológico
- **Given** un servicio de "Cirugía Menor" u "Odontología Básica"
- **When** se crea la cita
- **Then** el sistema asigna automáticamente un espacio de tipo `SalaProcedimientos` disponible en ese rango horario

#### Scenario: Cita de baño o peluquería
- **Given** un servicio de "Baño y Peluquería (Grooming)"
- **When** se crea la cita
- **Then** el sistema asigna automáticamente un espacio de tipo `AreaGrooming` disponible en ese rango horario

---

### Requirement: Prevención de Solapamiento Físico en Consultorios (`HU-028`, `RF-085`)
El sistema debe impedir que dos citas independientes ocupen la misma sala física a la misma hora, incluso si son atendidas por veterinarios diferentes.

#### Scenario: Intento de reserva en consultorio ocupado
- **Given** que el `Consultorio 1` tiene una cita confirmada de 10:00 AM a 10:30 AM
- **And** solo queda 1 consultorio médico en la clínica
- **When** un segundo veterinario intenta agendar otra cita de 10:15 AM a 10:35 AM y no hay más consultorios médicos libres
- **Then** el sistema rechaza la solicitud con el mensaje *"No hay espacios físicos disponibles para este tipo de servicio en el horario seleccionado"*

---

### Requirement: Consulta de Ocupación en Tiempo Real (`HU-029`, `RF-083`)
El sistema debe proveer una API para visualizar la ocupación de cada consultorio en tiempo real.

#### Scenario: Obtener ocupación del día
- **Given** usuarios con rol `Admin`, `Recepcionista` o `Veterinario`
- **When** consultan `GET /api/consultorios/ocupacion?fecha=2026-07-31`
- **Then** el sistema retorna la lista de consultorios indicando su estado (`Libre`, `Ocupado`) y la cita actual asignada
