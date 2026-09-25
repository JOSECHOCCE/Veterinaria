# Proposal: Sprint 1 — Agenda, Clientes, Veterinarios y Espacios Físicos (Consultorios)

- **Change Name**: `sprint-1-agenda-consultorios`
- **Target Stories**: `HU-001`, `HU-002`, `HU-021` a `HU-029` (`RF-001` a `RF-005`, `RF-076` a `RF-086`)
- **Status**: Proposed

---

## 1. Intent & Problem Statement

En la gestión diaria de VetCare Pro, la agenda de citas requiere no solo validar la disponibilidad del profesional veterinario, sino también la disponibilidad del **espacio físico reservable** (Consultorios médicos, Sala de Procedimientos Quirúrgicos, Área de Grooming).

Actualmente:
1. `HU-001`, `HU-002`, `HU-021` a `HU-025` se encuentran ampliamente implementados (Clientes, Mascotas, Citas básicas, Horarios y Especialidades).
2. **Brecha Crítica (`HU-026` a `HU-029`)**: No existe una entidad de dominio `Consultorio` ni un campo `ConsultorioId` en `Cita.cs`. Esto impide que el sistema asigne automáticamente el espacio físico según el tipo de servicio agendado y bloquee el solapamiento de dos citas en la misma sala física a la misma hora.

---

## 2. Proposed Scope & Solution

### A. Dominio & Infraestructura
- **Entidad `Consultorio`**: `Id`, `Nombre`, `TipoEspacio` (`Consultorio`, `SalaProcedimientos`, `AreaGrooming`), `Capacidad`, `Activo`.
- **Relación en `Cita`**: Agregar `ConsultorioId` (FK nullable) y propiedad de navegación en `Cita.cs`.
- **Seeder Inicial (`DbSeeder.cs`)**: Cargar los espacios estándar según `RF-086` (2 Consultorios, 1 Sala de Procedimientos, 1 Área de Grooming).

### B. Lógica de Negocio (`CitaService` & `ConsultorioService`)
- **Asignación Automática (`HU-027`)**: Al agendar una cita:
  - *Consulta general / vacunación* -> Asigna un `Consultorio` médico disponible.
  - *Cirugía menor / odontología* -> Asigna la `SalaProcedimientos` disponible.
  - *Grooming / baño* -> Asigna el `AreaGrooming` disponible.
- **Validación de Solapamiento Físico (`HU-028`)**: Al intentar agendar, verificar que el `ConsultorioId` asignado no tenga otra cita confirmada/pendiente en el rango `[FechaHora, FechaHora + DuracionMinutos]`.
- **Monitoreo de Ocupación (`HU-029`)**: Servicio y DTOs para consultar el estado en tiempo real (libre/ocupado) de cada espacio físico.

---

## 3. User Review & Proposal Shaping Questions

1. **Capacidad y Concurrencia por Área**: ¿El área de Grooming permite múltiples mascotas simultáneas si hay varios peluqueros, o cada área/mesa se trata como un espacio unitario reservable?
   *(Asunción por defecto: cada espacio físico registrado se modela como recurso unitario reservable para el MVP)*.
2. **Reagendamiento y Cambio de Sala**: Si un veterinario necesita mover una cita de sala durante la atención en vivo, ¿debe ser configurable desde el panel de recepción/atención médica?
   *(Asunción por defecto: sí, mediante actualización del `ConsultorioId` en la cita)*.

---

## 4. Expected Deliverables & Testing Plan

1. **Backend**:
   - Nuevos modelos, DTOs, Controlador `ConsultoriosController.cs` y migración/seeder.
   - Pruebas unitarias e integración en `CitaServiceTests.cs` y `ConsultorioServiceTests.cs`.
2. **Frontend**:
   - Componentes de administración de espacios físicos y visualización de ocupación en agenda.
