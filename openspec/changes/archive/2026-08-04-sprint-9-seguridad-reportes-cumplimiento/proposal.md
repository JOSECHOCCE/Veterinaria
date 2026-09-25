# Proposal: Sprint 9 — Seguridad, Reportes y Cumplimiento

## Change Identifier: `sprint-9-seguridad-reportes-cumplimiento`

## Executive Summary
This proposal introduces the **`seguridad-reportes-cumplimiento`** capability for VetCare Pro. It addresses regulatory data privacy compliance (ARCO/GDPR client PII anonymization while retaining mandatory 5-10 year clinical histories), enterprise audit logging of critical actions, role-based authorization matrix enforcement, and categorized financial revenue breakdown reports (Services, Pharmacy, Petshop).

## Motivation & Business Value
1. **Regulatory Privacy Compliance**: Clients requesting account deletion or data erasure must be anonymized to protect personal data (`HU-039`, `RNF-022`), while preserving medical records for animal welfare tracking and health surveillance (`RNF-021`).
2. **Auditability & Fraud Prevention**: Sensitive operational changes (sales voids, clinical note edits after consultation closure, client anonymizations, price discounts) must leave an immutable log (`RF-032`).
3. **Financial Business Intelligence**: Clinic administrators require segregated revenue visibility (`HU-019`) to evaluate performance across Consultation Services, Pharmacy/Prescription sales, and Retail Petshop goods.
4. **Granular Access Control**: Ensuring strict role boundaries (`HU-018`) so receptionists cannot view net profit margins or edit medical histories, and veterinarians cannot alter billing configurations.

## Scope of Changes

### Capabilities Introduced / Modified
- **New Capability**: `seguridad-reportes-cumplimiento`

### Key Functional Requirements
- **`HU-018`**: Role-based access control matrix enforcement (`Admin`, `Veterinario`, `Recepcionista`, `Cliente`).
- **`HU-019`**: Financial revenue reports with category segregation (Servicios Médicos, Botica/Farmacia, Petshop).
- **`HU-039`**: Irreversible client PII anonymization while preserving linked patient histories.
- **`RF-032`**: Audit logging for critical system operations.
- **`RNF-021`**: 5-10 year medical history retention.
- **`RNF-022`**: Irreversible PII masking.

## Out of Scope (Non-Goals)
- External accounting software export (SAP/QuickBooks) — handled in future enterprise integrations.
- Advanced automated biometrics or hardware-level key cards for audit log authentication.

## Proposed Architecture & Component Overview

```
                      +-----------------------------+
                      |   Seguridad & Authorization |
                      +--------------+--------------+
                                     |
    +--------------------------------+--------------------------------+
    |                                |                                |
    v                                v                                v
+----------------------+   +-------------------+   +----------------------+
| AnonymizationService |   | AuditoriaService  |   |    ReporteService    |
| (PII Masking)        |   | (Immutable Logs)  |   | (Categorized Revenue)|
+----------+-----------+   +---------+---------+   +----------+-----------+
           |                         |                        |
           v                         v                        v
+----------------------+   +-------------------+   +----------------------+
| Cliente / Mascota    |   | AuditoriaLog      |   | OrdenesCobro / Ventas|
| DbContext Entities   |   | DbContext Table   |   | Data Aggregation     |
+----------------------+   +-------------------+   +----------------------+
```

### Affected Files / Components
- `Veterinaria.Domain/Entities/AuditoriaLog.cs` (New)
- `Veterinaria.Infrastructure/Persistence/VeterinariaDbContext.cs` (DbSet<AuditoriaLog>)
- `Veterinaria.Domain/Contracts/IUnitOfWork.cs` & `UnitOfWork.cs` (Add `AuditoriaLogs`)
- `Veterinaria.Application/Interfaces/IAnonymizationService.cs` & `AnonymizationService.cs` (New)
- `Veterinaria.Application/Interfaces/IAuditoriaService.cs` & `AuditoriaService.cs` (Update/Implement)
- `Veterinaria.Application/Interfaces/IReporteService.cs` & `ReporteService.cs` (New)
- `Veterinaria.Web/Controllers/SeguridadController.cs` & `ReportesController.cs` (New)
- `Veterinaria.Tests/Application/SeguridadReportesTests.cs` (New Unit Tests)

## Risk Analysis & Mitigation
- **Risk**: Deleting a client entity breaks foreign key constraints on `HistorialClinico` or `OrdenCobro`.
  - *Mitigation*: Perform soft PII masking in-place (`Nombre = "Cliente Anónimo #123"`, `Email = null`, `EsAnonimizado = true`) rather than executing hard SQL `DELETE`.
- **Risk**: Audit logging failing during business transactions.
  - *Mitigation*: Wrap audit log entries within the same database transaction scope or handle logging exceptions cleanly to avoid blocking valid transactions.

## Acceptance Criteria Overview
1. Anonymizing a client replaces DNI, email, phone, and address with masked values while retaining pets and clinical history records.
2. Financial revenue report returns exact totals for Services, Pharmacy, and Petshop over any given date range.
3. Performing an anonymization or sales void creates an entry in `AuditoriaLog`.
4. All existing 288 unit tests continue passing 100%, plus 5 new unit tests added (total 293+ tests).
