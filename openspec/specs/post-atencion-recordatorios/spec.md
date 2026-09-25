# post-atencion-recordatorios Specification

## Purpose

Defines the requirements and business rules for post-attention patient follow-ups (`SeguimientoPostAtencion`, `HU-016`) and automated vaccination/deworming booster reminders (`RecordatorioVacuna`, `HU-017`).

## Requirements

### Requirement: Programación y Registro de Seguimiento Post-Atención Médica

The system MUST schedule a post-care follow-up entry (`SeguimientoPostAtencion`) when a clinical consultation or surgical procedure is completed (`HU-016`, `RF-018`).

#### Scenario: Programación automática de seguimiento post-atención

- GIVEN a completed medical consultation or surgery record (`HistorialClinico`)
- WHEN the consultation is closed by the veterinarian
- THEN the system MUST schedule a `SeguimientoPostAtencion` record set for 24 hours later with status `"Pendiente"`.

#### Scenario: Registro de seguimiento telefónico con evolución favorable

- GIVEN a pending post-care follow-up record for a patient
- WHEN staff contacts the owner and logs the evolution result as `"Favorable"`
- THEN the system MUST update status to `"Contactado"`
- AND record the follow-up notes and timestamp.

#### Scenario: Alerta médica por complicación en seguimiento post-atención

- GIVEN a pending post-care follow-up record
- WHEN staff records that the patient presents complications and marks `"Revisión Requerida"`
- THEN the system MUST update status to `"Revisión Requerida"`
- AND emit a `Warning` notification to the treating veterinarian.

---

### Requirement: Recordatorios Automáticos de Vacunación y Desparasitación

The system MUST schedule and issue automated reminders for upcoming vaccination and deworming boosters (`HU-017`, `RF-019`).

#### Scenario: Programación de recordatorio de refuerzo de vacuna

- GIVEN a vaccination or deworming treatment registered during consultation
- WHEN the veterinarian sets the booster date (`FechaVencimiento`)
- THEN the system MUST create a `RecordatorioVacuna` record with status `"Programado"`.

#### Scenario: Emisión de alerta preventiva 3 días antes del vencimiento

- GIVEN a scheduled `RecordatorioVacuna` due in 3 days
- WHEN the notification service runs daily processing
- THEN the system MUST send a reminder notification to the pet owner detailing the vaccine/deworming booster date.
