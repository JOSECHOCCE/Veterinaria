# Proposal: Sprint 2 — Notificaciones Automáticas y Cancelación con Lista de Espera

- **Change Name**: `sprint-2-notificaciones-cancelaciones`
- **Target Stories**: `HU-003`, `HU-004` (`RF-006` a `RF-010`)
- **Baseline**: 263 passing unit tests (Sprint 1 verified)

---

## Solution Summary

### 1. Recordatorio 2h Antes (RF-007, HU-003)
Extend `CitaStatusService` to include a 2nd reminder window checking citas with `FechaHora` between 1h and 3h from now. Deduplicates using the existing `Notificaciones` table by checking for `Titulo.Contains("Recordatorio")` + matching `UrlAccion`.

### 2. Lista de Espera Entity (RF-009, HU-004)
New domain entity `ListaEspera`:
- `Id`, `MascotaId` (FK), `ServicioId` (FK), `VeterinarioId?` (FK, optional preference), `FechaDeseada` (date range start), `FechaDeseadaFin` (date range end), `Estado` (Pendiente/Notificada/Convertida/Expirada/Cancelada), `FechaCreacion`, `FechaNotificacion?`, `NotificadoUsuarioId?`.

### 3. Auto-Offer on Cancel (RF-009)
When `CancelarCitaAsync` succeeds:
1. Query `ListaEspera` entries with matching `ServicioId` and `FechaDeseada <= cita.FechaHora.Date <= FechaDeseadaFin` and `Estado == "Pendiente"`.
2. Order by `FechaCreacion` (FIFO).
3. Notify the first match via in-app + email.
4. Mark entry as `"Notificada"` with `FechaNotificacion`.

### 4. Waitlist CRUD API
New `ListaEsperaController` with:
- `POST /api/lista-espera` — Add to waitlist
- `GET /api/lista-espera` — List entries for current user
- `DELETE /api/lista-espera/{id}` — Remove from waitlist

### 5. Anti Doble-Reserva (RF-010)
Already implemented in Sprint 0 via `ValidarDisponibilidadAsync`. No changes needed.

---

## Impact Assessment
- **Risk**: Low — No breaking changes. ListaEspera is a new isolated entity.
- **Estimated Lines**: ~200 new/modified lines.
- **Dependencies**: None beyond existing Sprint 0+1 infrastructure.
