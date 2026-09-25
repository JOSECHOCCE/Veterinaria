# Capability Spec: Check-in y Triaje (checkin-triaje)

## Requirement: Patient Reception Check-in (HU-005)

### Scenario: Successful check-in of a confirmed appointment
- **Given** an appointment with status "Confirmada" or "Pendiente" scheduled for today
- **When** reception staff invokes `CheckInCitaAsync(citaId)`
- **Then** the appointment status changes to "EnSalaDeEspera"
- **And** a linked triaje entry is automatically created with status "EnEspera"
- **And** an audit log entry is recorded for the check-in operation

### Scenario: Rejection of check-in for cancelled or completed appointment
- **Given** an appointment with status "Cancelada", "Completada", or "NoAsistio"
- **When** reception staff attempts to invoke check-in
- **Then** the system rejects the request with a validation error
- **And** no triaje entry is created

## Requirement: Triaje Intake & Vital Signs Registration (HU-006)

### Scenario: Recording vital signs and urgency level classification
- **Given** a patient in the triaje waiting queue
- **When** medical staff records vital signs (Temperatura, FrecuenciaCardiaca, PesoEstimado) and urgency level ("N1", "N2", "N3")
- **Then** the triaje entry is updated with the vital signs
- **And** `PrioridadColor` is set automatically ("Rojo" for N1, "Naranja" for N2, "Verde" for N3)

### Scenario: Automatic queue re-sorting by urgency priority
- **Given** multiple patients in the triaje queue
- **When** a new emergency patient is registered with urgency level "N1"
- **Then** the triaje queue orders "N1" patients above "N2" and "N3" patients
- **And** patients within the same urgency level are sorted by registration time ascending

### Scenario: Walk-in emergency intake without appointment
- **Given** an emergency patient arriving without a prior appointment
- **When** staff registers a triaje entry with `CitaId = null`, valid `MascotaId`, and `Nivel = "N1"`
- **Then** the triaje entry is created successfully and placed in the active triaje queue
