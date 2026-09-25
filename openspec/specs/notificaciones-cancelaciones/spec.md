# Specification: Domain Notificaciones y Cancelaciones

- **Domain**: `notificaciones-cancelaciones`
- **Target Stories**: `HU-003`, `HU-004` (`RF-006` a `RF-010`)
- **Status**: Active / Approved (Sprint 2)

---

## 1. Domain Entities & Persistence

### Entity: `ListaEspera`
- `Id`: int (PK)
- `MascotaId`: int (FK → Mascotas)
- `ServicioId`: int (FK → Servicios)
- `VeterinarioPreferidoId`: int? (FK → Veterinarios, optional)
- `FechaDeseada`: DateTime
- `FechaDeseadaFin`: DateTime
- `Estado`: string ("Pendiente", "Notificada", "Convertida", "Expirada", "Cancelada")
- `FechaCreacion`: DateTime (UTC)
- `FechaNotificacion`: DateTime? (UTC)

---

## 2. Notification Rules

1. **Confirmation Notification (RF-006)**: Triggered immediately when cita transitions to `Confirmada`. Sends in-app SignalR notification + email.
2. **24h Reminder (RF-007)**: `CitaStatusService` background loop evaluates `Confirmada` citas 23-25 hours in advance and sends reminder. Deduplicated against existing notifications.
3. **2h Reminder (RF-007)**: `CitaStatusService` background loop evaluates `Confirmada` citas 1-3 hours in advance and sends reminder. Deduplicated against existing recent notifications.
4. **Waitlist Auto-Offer on Cancel (RF-009)**: When a `Confirmada` cita is cancelled, the system searches `ListaEspera` for matching `ServicioId` and date range (`FechaDeseada <= cita.FechaHora.Date <= FechaDeseadaFin`) in FIFO order (`FechaCreacion ASC`). The first matching entry is updated to `"Notificada"` with timestamp, and a notification + email is dispatched to the candidate's owner.

---

## 3. API Endpoints

- `POST /api/lista-espera` — Create waitlist entry (returns 201 Created)
- `GET /api/lista-espera` — List entries (filtered by owner for clients, all for staff)
- `DELETE /api/lista-espera/{id}` — Cancel waitlist entry (returns 204 No Content)
