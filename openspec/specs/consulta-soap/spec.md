# Capability Spec: Consulta Clínica SOAP, Presupuesto, Consentimiento y Receta Digital (consulta-soap)

## Requirement: SOAP Medical Consultation Intake & History (HU-007, RF-014, RF-015)

### Scenario: Saving consultation draft in explicit SOAP format
- **Given** a patient with an appointment in status "EnAtencion"
- **When** medical staff records `Subjetivo`, `Objetivo`, `Analisis`, and `Plan`
- **Then** the draft `HistorialClinico` is created with status `Cerrado = false`
- **And** vital signs (Peso, Temperatura, FrecuenciaCardiaca) update the pet's profile

### Scenario: Viewing past clinical history timeline during active consultation
- **Given** a pet with 2 previous closed consultations
- **When** medical staff opens the consultation view for a new appointment
- **Then** the system displays the timeline of previous closed medical records for that pet ordered descending by date

### Scenario: Inviolability of closed record and appending an Addendum
- **Given** a `HistorialClinico` record with `Cerrado = true`
- **When** staff attempts to edit the original SOAP fields directly or invoke physical deletion
- **Then** the system rejects the modification request
- **And** if an authorized user submits an Addendum, it is appended to `Addendum` notes with timestamp and author signature

---

## Requirement: Medical Budget & Procedure Proposal (HU-008, RF-017)

### Scenario: Generating a medical treatment budget
- **Given** a consultation requiring an optional procedure or lab test
- **When** the veterinarian creates a `Presupuesto` with detail items (Concepto, Cantidad, PrecioUnitario)
- **Then** the total `MontoTotal` is calculated automatically
- **And** the budget status is set to "PendienteAprobacion"

### Scenario: Client accepts treatment budget
- **Given** a budget in status "PendienteAprobacion"
- **When** the client approves the proposal
- **Then** the status changes to "Aceptado"
- **And** the accepted items are queued for automatic billing inclusion upon consultation closure

---

## Requirement: Informed Consent Enforcement (HU-008, RF-017)

### Scenario: Mandatory consent verification for surgical/anesthetic procedures
- **Given** a consultation for a service of type "Cirugía", "Anestesia", or "Hospitalización"
- **When** the veterinarian attempts to close the consultation (`CerrarAtencionAsync`)
- **Then** the system verifies if an accepted `Consentimiento` exists for the pet and cita
- **And** if no accepted consent exists, closing the consultation is blocked with a validation error

---

## Requirement: Digital Prescription & Inventory Awareness (HU-009, RF-016, RNF-019)

### Scenario: Issuing a digital prescription with in-house vs external purchase items
- **Given** an active consultation
- **When** the veterinarian prescribes a medication available in internal stock (`EsStockInterno = true`) and another not in stock (`EsStockInterno = false`)
- **Then** the prescription is saved successfully
- **And** items marked `EsStockInterno = true` are linked for internal inventory billing
- **And** items marked `EsStockInterno = false` generate a printable external prescription slip without blocking consultation closure

### Scenario: Mandatory prescription drug traceability (RNF-019)
- **Given** a prescribed product flagged as "RequiereRecetaObligatoria"
- **When** the digital prescription is created
- **Then** the prescription record permanently logs veterinarian prescriptor ID, client ID, pet ID, dosage, frequency, and emission timestamp

---

## Requirement: Auto-Billing Order Generation (RF-018)

### Scenario: Automatic billing order generation on consultation closure
- **Given** a consultation with an accepted budget and internal stock prescription items
- **When** the veterinarian closes the consultation (`CerrarAtencionAsync`)
- **Then** the appointment status changes to "Completada"
- **And** a pending `Pago` / `OrdenCobro` is generated automatically containing consultation fee + internal prescription items + accepted budget items
- **And** a real-time notification is dispatched to reception/caja
