# Technical Design: Sprint 9 — Seguridad, Reportes y Cumplimiento

## Executive Summary
- **Change Target**: `sprint-9-seguridad-reportes-cumplimiento`
- **Architecture Level**: Domain Entities, Application Services, Infrastructure Persistence & Controllers.
- **Key Modules**:
  1. **PII Anonymization Subsystem** (`AnonymizationService`) for ARCO/GDPR compliance with clinical history retention (`HU-039`, `RNF-021`, `RNF-022`).
  2. **Immutable Audit Trail Subsystem** (`AuditoriaLog`, `AuditoriaService`) for sensitive action tracking (`RF-032`).
  3. **Categorized Financial Revenue Breakdown Subsystem** (`ReporteService`) by Business Units: Consultation Services, Pharmacy/Prescription sales, and Petshop Retail goods (`HU-019`).
  4. **RBAC Security Matrix Enforcement** (`HU-018`).

---

## Data Model & Domain Entities

### 1. `AuditoriaLog.cs` (New Entity in `Veterinaria.Domain/Entities/`)
```csharp
namespace Veterinaria.Domain.Entities;

public class AuditoriaLog
{
    public long Id { get; set; }
    public int? UsuarioId { get; set; }
    public string Accion { get; set; } = default!; // "AnonimizacionCliente", "AnulacionVenta", "ModificacionHistorial", "AjusteInventario"
    public string EntidadNombre { get; set; } = default!; // "Usuario", "Venta", "HistorialClinico"
    public string EntidadId { get; set; } = default!;
    public string? DatosPreviosJson { get; set; }
    public string? DatosNuevosJson { get; set; }
    public string? IpAddress { get; set; }
    public DateTime Fecha { get; set; } = DateTime.UtcNow;

    public virtual Usuario? Usuario { get; set; }
}
```

### 2. `Usuario.cs` Extensions (in `Veterinaria.Domain/Entities/Usuario.cs`)
- Add `public bool EsAnonimizado { get; set; } = false;`
- Add `public DateTime? FechaAnonimizacion { get; set; }`

---

## Service Contracts & Interfaces

### 1. `IAnonymizationService.cs` (in `Veterinaria.Application/Interfaces/`)
```csharp
namespace Veterinaria.Application.Interfaces;

public interface IAnonymizationService
{
    Task<Usuario> AnonimizarClienteAsync(int clienteUsuarioId, int ejecutadoPorUsuarioId, string? ipAddress);
}
```

### 2. `IReporteService.cs` (in `Veterinaria.Application/Interfaces/`)
```csharp
namespace Veterinaria.Application.Interfaces;

public interface IReporteService
{
    Task<ReporteIngresosCategorizadoDto> ObtenerIngresosCategorizadosAsync(DateTime fechaInicio, DateTime fechaFin);
}

public class ReporteIngresosCategorizadoDto
{
    public DateTime FechaInicio { get; set; }
    public DateTime FechaFin { get; set; }
    public decimal TotalServiciosMedicos { get; set; }
    public decimal TotalFarmaciaBotica { get; set; }
    public decimal TotalPetshopRetail { get; set; }
    public decimal TotalGeneral => TotalServiciosMedicos + TotalFarmaciaBotica + TotalPetshopRetail;
    public int CantidadOrdenesServicios { get; set; }
    public int CantidadVentasFarmacia { get; set; }
    public int CantidadVentasPetshop { get; set; }
}
```

### 3. `IAuditoriaService.cs` (Update/Implement in `Veterinaria.Application/Interfaces/`)
```csharp
namespace Veterinaria.Application.Interfaces;

public interface IAuditoriaService
{
    Task RegistrarAccionAsync(int? usuarioId, string accion, string entidadNombre, string entidadId, string? datosPrevios, string? datosNuevos, string? ipAddress);
    Task<IEnumerable<AuditoriaLog>> ObtenerLogsAuditoriaAsync(DateTime? fechaInicio = null, DateTime? fechaFin = null);
}
```

---

## Business Logic Specifications

### 1. Client PII Anonymization Protocol (`AnonymizationService.cs`)
- Validates target `Usuario` exists and has `Rol == "Cliente"`.
- Modifies properties in-place without dropping SQL row:
  - `Nombre = $"Cliente Anónimo #{cliente.Id}"`
  - `Dni = "00000000"`
  - `Email = $"anonimo_{cliente.Id}@deleted.local"`
  - `Telefono = "000000000"`
  - `Direccion = "ANONIMIZADO"`
  - `EsAnonimizado = true`
  - `FechaAnonimizacion = DateTime.UtcNow`
- Calls `_auditoriaService.RegistrarAccionAsync(...)` logging action `"AnonimizacionCliente"`.
- Persists changes via `_unitOfWork.CommitAsync()`.

### 2. Revenue Categorization Protocol (`ReporteService.cs`)
- Query 1: Sum paid `OrdenCobro` records (`EstadoPago == "Pagado"`) within range for Medical Services.
- Query 2: Sum completed `Venta` records within range for Pharmacy (`RequiereReceta == true` or `TipoProducto == "Medicamento"`).
- Query 3: Sum completed `Venta` records within range for Petshop retail (`TipoProducto != "Medicamento"`).

---

## API Endpoints & Controller Contracts

### 1. `SeguridadController.cs` (in `Veterinaria.Web/Controllers/`)
- `POST /api/Seguridad/anonimizar-cliente/{id}`
  - **Authorize**: `Roles = "Admin"`
  - Calls `IAnonymizationService.AnonimizarClienteAsync`.
- `GET /api/Seguridad/auditoria`
  - **Authorize**: `Roles = "Admin"`
  - Calls `IAuditoriaService.ObtenerLogsAuditoriaAsync`.

### 2. `ReportesController.cs` (in `Veterinaria.Web/Controllers/`)
- `GET /api/Reportes/ingresos-categorizados?fechaInicio=...&fechaFin=...`
  - **Authorize**: `Roles = "Admin"` (Receptionists receive 403 Forbidden).
  - Calls `IReporteService.ObtenerIngresosCategorizadosAsync`.

---

## Unit Testing Strategy (`Strict TDD`)
- Target: `Veterinaria.Tests/Application/SeguridadReportesTests.cs`
- Test Scenarios:
  1. `AnonimizarClienteAsync_DebeEnmascararPiiEIrreversiblementeYConservarMascotas`
  2. `AnonimizarClienteAsync_DebeRegistrarLogAuditoria`
  3. `ObtenerIngresosCategorizadosAsync_DebeDesglosarCorrectamenteServiciosBoticaYPetshop`
  4. `RegistrarAccionAsync_DebeGrabarRegistroEnTablaAuditoriaLog`
  5. `ObtenerLogsAuditoriaAsync_DebeFiltrarPorRangoFechas`
- Execution Goal: Suite expands from 288 to 293+ unit tests (100% passing).
