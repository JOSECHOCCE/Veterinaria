# Technical Design: Sprint 1 — Agenda y Gestión de Espacios Físicos (Consultorios)

- **Change Name**: `sprint-1-agenda-consultorios`
- **Target Stories**: `HU-001`, `HU-002`, `HU-021` a `HU-029`
- **Status**: Designed

---

## 1. Technical Approach

Implementar el modelo formal de **Espacios Físicos / Consultorios** en la Clean Architecture de VetCare Pro:
1. **Domain Layer**: Entidad `Consultorio` y enum/constantes `TipoEspacioFisico`. Relación FK `ConsultorioId` en `Cita`.
2. **Infrastructure Layer**: Mapping EF Core Fluent API en `VeterinariaDbContext`, migración y Seeder de salas por defecto.
3. **Application Layer**: DTOs (`ConsultorioDto`, `CrearConsultorioDto`, `OcupacionConsultorioDto`), `IConsultorioService`, `ConsultorioService`, y extensión de `CitaService` para asignación automática y prevención de conflicto.
4. **Web API Layer**: `ConsultoriosController` con autorización por rol (`Admin` para gestión, `Admin,Recepcionista,Veterinario` para lectura/ocupación).

---

## 2. Architecture Decisions

### Decision 1: Relación de `ConsultorioId` Nullable en `Cita`
- **Choice**: `public int? ConsultorioId { get; set; }` en `Cita.cs`.
- **Rationale**: Mantiene compatibilidad con citas pasadas o registradas antes de la migración sin romper referencias existentes.

### Decision 2: Mapeo de Servicios a Tipos de Espacio
- **Choice**: Mapeo determinista en `CitaService` según la categoría/nombre del servicio:
  - *Cirugía / Procedimiento* ➔ `TipoEspacioFisico.SalaProcedimientos`
  - *Grooming / Baño* ➔ `TipoEspacioFisico.AreaGrooming`
  - *Consulta / Vacuna / Otros* ➔ `TipoEspacioFisico.Consultorio`
- **Rationale**: Automatiza el flujo para recepción cumpliendo `HU-027` sin fricción manual.

---

## 3. Data Models & API Specifications

### Domain Entity: `Consultorio.cs`
```csharp
public class Consultorio
{
    public int Id { get; set; }
    public string Nombre { get; set; } = default!; // "Consultorio 1", "Sala 2"
    public string TipoEspacio { get; set; } = "Consultorio"; // "Consultorio", "SalaProcedimientos", "AreaGrooming"
    public int Capacidad { get; set; } = 1;
    public bool Activo { get; set; } = true;
    public virtual ICollection<Cita> Citas { get; set; } = new List<Cita>();
}
```

### API Contracts (`ConsultoriosController`)
- `GET /api/consultorios`: Obtiene todos los espacios físicos.
- `POST /api/consultorios`: Crea un nuevo espacio (solo `Admin`).
- `GET /api/consultorios/ocupacion?fecha=YYYY-MM-DD`: Retorna ocupación de salas en el día.
