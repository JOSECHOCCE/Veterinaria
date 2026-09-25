# Exploration: Sprint 2 — Notificaciones Automáticas y Cancelación con Lista de Espera

- **Change Name**: `sprint-2-notificaciones-cancelaciones`
- **Target Stories**: `HU-003`, `HU-004` (`RF-006` a `RF-010`)
- **Status**: Explored

---

## 1. Scope & Functional Requirements

### HU-003 — Notificación y recordatorio automático (RF-006, RF-007)
- **RF-006**: Notificación automática (WhatsApp/email) al confirmar la cita.
- **RF-007**: Recordatorios automáticos 24h y 2h antes.
- **Given** que se confirmó una cita, **Then** recibo notificación inmediata, **And** recordatorio 24h antes, **And** recordatorio 2h antes.

### HU-004 — Cancelación con lista de espera (RF-008, RF-009, RF-010)
- **RF-008**: Reprogramar o cancelar cita, liberando el horario.
- **RF-009**: Ofrecer el cupo cancelado a lista de espera si existe.
- **RF-010**: Evitar doble-reserva del mismo veterinario en el mismo horario.
- **Given** una cita confirmada, **When** el cliente cancela, **Then** el horario queda libre, **And** si hay lista de espera, se notifica al siguiente.

---

## 2. Current State Analysis

### Already Implemented (Sprint 0 + Sprint 1):

| Feature | Status | Where |
|---------|--------|-------|
| `Notificacion` entity | ✅ Done | `Domain/Entities/Notificacion.cs` |
| `INotificacionService` interface | ✅ Done | `Application/Interfaces/INotificacionService.cs` |
| `NotificacionService` (full) | ✅ Done | `Application/Services/NotificacionService.cs` |
| `NotificarCitaConfirmadaAsync` (RF-006) | ✅ Done | Line 120-142 |
| `NotificarCitaCanceladaAsync` | ✅ Done | Line 223-245 |
| `NotificarRecordatorioCitaAsync` | ✅ Done | Line 295-318 |
| `ProcesarAlertasDiariasAsync` (24h reminder) | ✅ Done | Line 392-463 |
| `CitaStatusService` (BackgroundService, 24h reminder) | ✅ Done | `Web/Services/CitaStatusService.cs` |
| `CancelarCitaAsync` (basic cancel, no waitlist) | ✅ Done | `Application/Services/CitaService.cs:600-629` |
| `NotificacionHub` (SignalR) | ✅ Done | `Web/Hubs/NotificacionHub.cs` |

### Gaps Identified:

| Gap | Requirement | Priority |
|-----|-------------|----------|
| **Recordatorio 2h antes** | RF-007 | HIGH — Currently only 24h reminder exists |
| **Lista de Espera entity** | RF-009 | HIGH — No `ListaEspera` entity exists |
| **Auto-offer waitlist on cancel** | RF-009 | HIGH — `CancelarCitaAsync` doesn't check waitlist |
| **Waitlist notification** | RF-009 | HIGH — No method to notify waitlist candidates |
| **Waitlist CRUD** | RF-009 | MEDIUM — No API to add/remove from waitlist |
| **Anti doble-reserva** | RF-010 | ✅ Already handled by existing `ValidarDisponibilidadAsync` |

---

## 3. Architecture Decisions

1. **`ListaEspera` entity**: New entity with `Id`, `MascotaId`, `ServicioId`, `FechaDeseada`, `Estado` (`Pendiente`, `Notificada`, `Convertida`, `Expirada`), `FechaCreacion`, `FechaNotificacion`.
2. **Recordatorio 2h antes**: Extend `CitaStatusService` to add a 2h reminder window (1h-3h before), deduplicating with existing 24h logic.
3. **Waitlist flow on cancel**: After `CancelarCitaAsync`, auto-query `ListaEspera` for matching `ServicioId` + `FechaDeseada` range, notify first match.
4. **No WhatsApp in MVP**: RF-006 mentions WhatsApp/email; in MVP we implement email + in-app (SignalR). WhatsApp deferred to post-MVP.

---

## 4. Files to Modify/Create

### New Files:
- `Domain/Entities/ListaEspera.cs`
- `Web/Controllers/ListaEsperaController.cs`

### Modified Files:
- `Domain/Contracts/IUnitOfWork.cs` — Add `ListaEsperas` repository
- `Infrastructure/Persistence/UnitOfWork.cs` — Implement `ListaEsperas`
- `Infrastructure/Persistence/VeterinariaDbContext.cs` — Add `DbSet<ListaEspera>`
- `Application/Interfaces/INotificacionService.cs` — Add `NotificarListaEsperaDisponibleAsync`
- `Application/Services/NotificacionService.cs` — Implement waitlist notification
- `Application/Services/CitaService.cs` — Extend `CancelarCitaAsync` to check waitlist
- `Web/Services/CitaStatusService.cs` — Add 2h reminder logic
