# Spec Delta: Sprint 9 — Seguridad, Reportes y Cumplimiento

## Capability: `seguridad-reportes-cumplimiento`

### Feature: Irreversible Client PII Anonymization & Medical History Retention (`HU-039`, `RNF-021`, `RNF-022`)

```gherkin
Scenario: Irreversible Client PII Anonymization upon Owner Request
  Given a registered client with DNI "45871234", email "juan.perez@email.com", phone "987654321", and address "Av. Larco 123"
  And the client has a registered pet "Firulais" with clinical history entries
  When the administrator executes the client anonymization request
  Then the client's name is updated to "Cliente Anónimo #<Id>"
  And the client's DNI is set to "00000000"
  And the client's email is set to "anonimo_<Id>@deleted.local"
  And the client's phone and address are set to "000000000" and "ANONIMIZADO"
  And the property "EsAnonimizado" is set to true
  And the PII masking is permanent and irreversible.

Scenario: Medical History Retention following Client Anonymization
  Given an anonymized client "Cliente Anónimo #10"
  And the client's pet "Firulais" with medical record ID 50
  When a veterinarian views the clinical history of "Firulais"
  Then all past consultation notes, diagnosis, prescriptions, and vaccination records remain fully accessible
  And the owner details display "Cliente Anónimo #10" without exposing personal identity data.
```

### Feature: Immutable Audit Log Generation (`RF-032`)

```gherkin
Scenario: Automatic Audit Logging for Sensitive Operations
  Given an authenticated administrator "Admin User" (ID: 1)
  When the administrator anonymizes a client or voids a sales invoice
  Then a new entry is recorded in the "AuditoriaLog" table
  And the audit entry contains the user ID 1, action name "AnonimizacionCliente" or "AnulacionVenta", target entity, timestamp, and JSON delta of previous vs new values.
```

### Feature: Categorized Financial Revenue Reports (`HU-019`)

```gherkin
Scenario: Generating Revenue Report Segregated by Business Units
  Given completed sales and paid billing orders within date range 2026-08-01 to 2026-08-04:
    | Category            | Order / Sale ID | Amount (S/) |
    | Servicios Médicos   | Orden #101      | 150.00      |
    | Farmacia / Botica   | Venta #201      | 85.00       |
    | Petshop / Retail    | Venta #202      | 45.00       |
  When the administrator requests the categorized financial report for the date range
  Then the report presents total revenue S/ 280.00
  And the report breaks down totals: Servicios Médicos S/ 150.00, Farmacia S/ 85.00, Petshop S/ 45.00.
```

### Feature: Role-Based Authorization Enforcement (`HU-018`)

```gherkin
Scenario: Restricting Financial Profit Reports to Receptionist Role
  Given a user authenticated with role "Recepcionista"
  When the receptionist attempts to access the financial revenue endpoint "/api/Reportes/ingresos-categorizados"
  Then the system responds with HTTP status 403 Forbidden
  And access to confidential profit metrics is denied.
```
