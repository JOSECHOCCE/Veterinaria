# Specification: Agenda, Citas y Gestión de Espacios Físicos (Consultorios)

- **Domain**: `agenda-consultorios`
- **Target Stories**: `HU-001`, `HU-002`, `HU-021` a `HU-029`

---

## 1. Requirements & Scenarios

### Requirement: EspacioFisico / Consultorio Model (`HU-026`, `RF-086`)
El sistema soporta un catálogo administrable de espacios físicos reservables para la clínica veterinaria.

#### Scenario: Creación y configuración de consultorios por defecto
- **Given** una clínica recién configurada
- **When** se ejecuta la inicialización de base de datos (`DbSeeder`)
- **Then** se crean 4 espacios físicos por defecto:
  - `Consultorio 1` (Tipo: Consultorio)
  - `Consultorio 2` (Tipo: Consultorio)
  - `Sala de Procedimientos` (Tipo: SalaProcedimientos)
  - `Área de Grooming` (Tipo: AreaGrooming)

#### Scenario: Administración de espacios por el Administrador
- **Given** un usuario autenticado con el rol `Admin`
- **When** realiza peticiones HTTP a `/api/consultorios` (GET, POST, PUT, ToggleActivo)
- **Then** el sistema permite crear, editar, listar y desactivar espacios físicos

---

### Requirement: Asignación Automática de Espacio Físico por Servicio (`HU-027`, `RF-083`, `RF-084`)
Al agendar o crear una cita médica o servicio, el sistema asigna automáticamente un consultorio o sala compatible que se encuentre disponible.

#### Scenario: Cita de consulta médica estándar
- **Given** un servicio de "Consulta General" o "Vacunación"
- **When** el recepcionista o cliente crea una cita
- **Then** el sistema busca un espacio de tipo `Consultorio` sin citas agendadas en ese rango horario y le asigna el `ConsultorioId`

#### Scenario: Cita de procedimiento quirúrgico u odontológico
- **Given** un servicio de "Cirugía Menor" u "Odontología Básica"
- **When** se crea la cita
- **Then** el sistema asigna automáticamente un espacio de tipo `SalaProcedimientos` disponible

#### Scenario: Cita de baño o peluquería
- **Given** un servicio de "Baño y Peluquería (Grooming)"
- **When** se crea la cita
- **Then** el sistema asigna automáticamente un espacio de tipo `AreaGrooming` disponible

---

### Requirement: Prevención de Solapamiento Físico en Consultorios (`HU-028`, `RF-085`)
El sistema impide que dos citas independientes ocupen la misma sala física a la misma hora.

#### Scenario: Intento de reserva en consultorio ocupado
- **Given** que el `Consultorio 1` tiene una cita confirmada de 10:00 AM a 10:30 AM y no hay más consultorios médicos libres
- **When** un segundo veterinario intenta agendar otra cita de 10:15 AM a 10:35 AM
- **Then** el sistema rechaza la solicitud lanzando la excepción *"No hay espacios físicos disponibles para este tipo de servicio en el horario seleccionado"*

---

### Requirement: Consulta de Ocupación en Tiempo Real (`HU-029`, `RF-083`)
El sistema provee una API para visualizar la ocupación de cada consultorio en tiempo real.

#### Scenario: Obtener ocupación del día
- **Given** usuarios con rol `Admin`, `Recepcionista` o `Veterinario`
- **When** consultan `GET /api/consultorios/ocupacion?fecha=YYYY-MM-DD`
- **Then** el sistema retorna la lista de consultorios indicando su estado (`Libre`, `Ocupado`) y la cita actual asignada
