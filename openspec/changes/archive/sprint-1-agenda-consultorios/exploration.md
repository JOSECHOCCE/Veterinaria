# SDD Exploration — Sprint 1: Agenda, Clientes, Veterinarios y Consultorios

- **Change Name**: `sprint-1-agenda-consultorios`
- **Target Stories**: `HU-001`, `HU-002`, `HU-021` a `HU-029` (`RF-001` a `RF-005`, `RF-076` a `RF-086`)
- **Status**: Explored

---

## 1. Domain & Codebase Analysis

### Existing Architecture & Strengths
- **Clientes & Mascotas (`HU-001`)**: `Usuario` y `Mascota` ampliamente implementados con búsqueda, desactivación lógica y 73+ tests unitarios pasando.
- **Horarios y Especialidades (`HU-021`, `HU-022`)**: `HorarioVeterinario` y `BloqueoHorario` existen y están mapeados en `Veterinario.cs`.
- **Citas Médicas Básicas (`HU-002`, `HU-023` a `HU-025`)**: `CitaService` valida disponibilidad del veterinario y soporta clínica con 1 solo médico.

### Identified Gap (`HU-026` a `HU-029`)
Actualmente el sistema no posee un modelo formal para los **Espacios Físicos / Consultorios** de la clínica. En la entidad `Triage`, `Consultorio` es una cadena libre ("Consultorio 1", "Sala de Shock"). `Cita.cs` no almacena `ConsultorioId` ni valida la disponibilidad física del espacio en el horario agendado.

---

## 2. Comparison of Architectural Approaches

| Criterio | Opción A: String libre en Cita | Opción B: Entidad `Consultorio` + Algoritmo de Asignación en `CitaService` (Recomendada) |
| :--- | :--- | :--- |
| **Cumplimiento `HU-026`** (Configurar espacios) | ❌ Imposible (no se puede editar cantidad ni tipos de salas). | ✅ Completo (Admin configura N consultorios y sus tipos). |
| **Cumplimiento `HU-027`** (Asignación por tipo de servicio) | ❌ Inexistente (requiere asignación manual por texto). | ✅ Automático (Consulta -> Consultorio; Cirugía -> Sala Procedimientos; Grooming -> Área Grooming). |
| **Cumplimiento `HU-028`** (Evitar solapamiento de sala) | ❌ Frágil (no valida solapamiento físico en DB). | ✅ Robusto (valida disponibilidad de `ConsultorioId` en el rango de fecha/hora). |
| **Cumplimiento `HU-029`** (Ver ocupación de espacios) | ❌ Inexistente. | ✅ Completo (Dashboard de ocupación en tiempo real). |

---

## 3. Proposed Impacted Files

### Backend Domain & Infrastructure
1. `[NEW]` [Consultorio.cs](file:///c:/Users/yaran/Documents/antigravity/Veterinaria/src/Backend/Veterinaria.Domain/Entities/Consultorio.cs): Entidad `Consultorio` (`Id`, `Nombre`, `TipoEspacio`, `Activo`).
2. `[NEW]` `TipoEspacioFisico.cs` (Enum: `Consultorio`, `SalaProcedimientos`, `AreaGrooming`).
3. `[MODIFY]` [Cita.cs](file:///c:/Users/yaran/Documents/antigravity/Veterinaria/src/Backend/Veterinaria.Domain/Entities/Cita.cs): Añadir `ConsultorioId` (FK nullable) y propiedad de navegación.
4. `[MODIFY]` [VeterinariaDbContext.cs](file:///c:/Users/yaran/Documents/antigravity/Veterinaria/src/Backend/Veterinaria.Infrastructure/Persistence/VeterinariaDbContext.cs): Añadir `DbSet<Consultorio>` y Fluent API.
5. `[MODIFY]` [DbSeeder.cs](file:///c:/Users/yaran/Documents/antigravity/Veterinaria/src/Backend/Veterinaria.Infrastructure/Data/DbSeeder.cs): Precargar los espacios por defecto (2 Consultorios, 1 Sala de Procedimientos, 1 Área de Grooming según `RF-086`).

### Backend Application & Web
6. `[NEW]` [ConsultorioService.cs](file:///c:/Users/yaran/Documents/antigravity/Veterinaria/src/Backend/Veterinaria.Application/Services/ConsultorioService.cs) & `IConsultorioService.cs`.
7. `[MODIFY]` [CitaService.cs](file:///c:/Users/yaran/Documents/antigravity/Veterinaria/src/Backend/Veterinaria.Application/Services/CitaService.cs): Asignación automática y filtro de conflicto físico.
8. `[NEW]` [ConsultoriosController.cs](file:///c:/Users/yaran/Documents/antigravity/Veterinaria/src/Backend/Veterinaria.Web/Controllers/ConsultoriosController.cs).

### Frontend
9. `[NEW]` `GestionEspaciosFisicos.tsx` & componentes de visualización de ocupación en tiempo real.

---

## 4. Next Step Recommendation

Proceder con la fase **`sdd-propose`** para formalizar la propuesta arquitectónica del módulo de Espacios Físicos y la asignación inteligente de Citas.
