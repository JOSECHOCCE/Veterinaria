# SDD Exploration: Sprint 9 — Seguridad, Reportes y Cumplimiento

## Executive Summary
- **Sprint Target**: `sprint-9-seguridad-reportes-cumplimiento`
- **Scope**: User Role Access Matrix (`HU-018`), Categorized Financial Revenue Reports (`HU-019`), Client Data Anonymization & Legal Retention (`HU-039`, `RNF-021`, `RNF-022`), and Critical Audit Trail (`RF-032`).
- **Domain Focus**: Enhancing enterprise security, regulatory privacy compliance, auditability, and financial business intelligence in veterinary clinic operations.

## Requirement Mapping & Real-World Veterinary Context

### 1. User Stories & Functional Requirements
| Requirement ID | Description | Real-World Veterinary Clinic Context | System Impact |
|----------------|-------------|---------------------------------------|---------------|
| `HU-018` | Role-Based Access Control (RBAC) | Receptionists cannot alter clinical history or access net profit reports; Veterinarians cannot modify billing configurations; Admins have full oversight. | Policy/Attribute enforcement across API controllers & navigation views. |
| `HU-019` | Categorized Financial Revenue Reports | Separation of clinic revenue streams: Medical Consultations/Procedures, Pharmacy/Prescriptions sales, and Retail/Petshop items for precise accounting. | `ReporteService` providing aggregated financial analytics filtered by date range and category. |
| `HU-039` | Client Data Anonymization | Clients requesting right to erasure (ARCO/GDPR) must have PII (DNI, phone, email, address) anonymized without destroying clinical histories required by law. | `AnonymizationService` masking PII while retaining patient medical records linked to an anonymized client ID. |
| `RF-032` | Critical Action Audit Trail | Auditing sensitive operations: sales cancellations, price overrides, clinical note edits after closure, and client anonymization. | `AuditoriaLog` entity tracking `UsuarioId`, `Accion`, `Entidad`, `EntidadId`, `ValoresAnteriores`, `ValoresNuevos`, and `Fecha`. |
| `RNF-021` | Mandatory Medical Record Retention | Legal obligation in veterinary medicine to retain clinical records for at least 5-10 years, even if owner deletes account or requests PII removal. | Anonymized foreign keys maintaining relational integrity between `HistorialClinico` and `Mascota`. |
| `RNF-022` | Irreversible Anonymization Protocol | Anonymization must be one-way (SHA-256 hash or pseudonymized tokens) so deleted client PII cannot be restored or reverse-engineered. | Irreversible string masking (`"CLIENTE_ANONIMO_XXXX"`) and nullification of contact fields. |

## Technical Architecture & Feasibility Analysis

### A. Anonymization Strategy (`HU-039`, `RNF-021`, `RNF-022`)
1. **Clinical History Integrity**: In veterinary clinics, medical histories belong legally to the patient record and public health surveillance (e.g. rabies vaccination history, controlled drug usage).
2. **PII Masking**:
   - `Nombre`: `"Cliente Anónimo #" + Id`
   - `Dni`: `"00000000"`
   - `Email`: `"anonimo_" + Id + "@deleted.local"`
   - `Telefono`: `"000000000"`
   - `Direccion`: `"ANONIMIZADO"`
   - `EsAnonimizado`: `true`
   - `FechaAnonimizacion`: `DateTime.UtcNow`
3. **Mascota & Historial Retention**: The `Mascota` and `HistorialClinico` records remain intact, preserving medical continuity without violating privacy rights.

### B. Audit Log System (`RF-032`)
1. Entity `AuditoriaLog`:
   - `Id` (long)
   - `UsuarioId` (int)
   - `Accion` (string: `"AnonimizacionCliente"`, `"AnulacionVenta"`, `"ModificacionHistorial"`, `"AjusteInventario"`)
   - `EntidadNombre` (string)
   - `EntidadId` (string)
   - `DatosPreviosJson` (string?)
   - `DatosNuevosJson` (string?)
   - `IpAddress` (string?)
   - `Fecha` (DateTime)

### C. Financial Revenue Breakdown (`HU-019`)
1. Categorization based on `OrdenCobro` and `Venta` details:
   - **Servicios Médicos**: Consultas, Cirugías, Desparasitaciones, Grooming.
   - **Farmacia / Botica**: Medicamentos vendidos por receta o venta directa.
   - **Petshop / Retail**: Alimentos, accesorios, juguetes.

## Verification & Testing Plan
1. **Unit Tests**:
   - Anonymize client verifies PII fields are irreversibly masked.
   - Anonymized client's pets and clinical histories remain accessible for medical audit.
   - Financial report service correctly calculates totals per category.
   - Audit log service records entries for sensitive operations.
2. **Target Test Suite**: Expand from 288 to 293+ unit tests (100% pass rate).

## Proposed SDD Roadmap
- `sdd-propose`: Define `seguridad-reportes-cumplimiento` capability proposal.
- `sdd-spec`: Create Gherkin specification for anonymization, audit logs, and revenue reports.
- `sdd-design`: Design `AuditoriaLog` entity, `AuditoriaService`, `ReporteService`, `AnonymizationService`, and endpoints.
- `sdd-tasks`: Break down TDD RED -> GREEN -> REFACTOR execution steps.
