# Technical Design: Sprint 2 — Notificaciones y Cancelación con Lista de Espera

- **Change Name**: `sprint-2-notificaciones-cancelaciones`
- **Target Stories**: `HU-003`, `HU-004`
- **Status**: Designed

---

## 1. Technical Approach

### Layer Architecture (Clean Architecture)

```
Domain (ListaEspera entity)
    ↓
Application (CitaService.CancelarCitaAsync + NotificacionService.NotificarListaEsperaDisponibleAsync)
    ↓
Infrastructure (UnitOfWork.ListaEsperas, DbContext.ListaEsperas)
    ↓
Web (ListaEsperaController, CitaStatusService 2h reminder)
```

### Key Design Decisions

1. **FIFO waitlist**: First-come-first-served ordering via `FechaCreacion ASC`.
2. **Single notification per cancel**: Only the first `Pendiente` entry matching service+date range is notified per cancellation event.
3. **Deduplication for 2h reminder**: Same strategy as 24h — check `Notificaciones` table for existing reminder with matching URL.
4. **Nullable `VeterinarioPreferidoId`**: Client can optionally prefer a specific vet. If set, waitlist matching also filters by vet.

---

## 2. Data Model Changes

### New Table: `ListaEsperas`

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| Id | int | NO | PK, auto-increment |
| MascotaId | int | NO | FK → Mascotas |
| ServicioId | int | NO | FK → Servicios |
| VeterinarioPreferidoId | int | YES | FK → Veterinarios |
| FechaDeseada | datetime | NO | Start of desired range |
| FechaDeseadaFin | datetime | NO | End of desired range |
| Estado | nvarchar(20) | NO | Default: "Pendiente" |
| FechaCreacion | datetime | NO | Default: UTC now |
| FechaNotificacion | datetime | YES | Set when notified |

### FK Relationships:
- `ListaEspera.MascotaId` → `Mascota.Id` (Required)
- `ListaEspera.ServicioId` → `Servicio.Id` (Required)
- `ListaEspera.VeterinarioPreferidoId` → `Veterinario.Id` (Optional)

---

## 3. Sequence Diagrams

### Cancel with Waitlist Flow
```
Client → CancelarCitaAsync(citaId)
  ├─ Validate (estado, ownership, 2h rule)
  ├─ cita.Estado = "Cancelada"
  ├─ UnitOfWork.Commit()
  ├─ AuditoriaService.RegistrarAccion()
  ├─ NotificacionService.NotificarCitaCanceladaAsync(cita)
  └─ ListaEspera query:
       ├─ Match: ServicioId == cita.ServicioId
       ├─ Match: FechaDeseada <= cita.FechaHora.Date <= FechaDeseadaFin
       ├─ Match: Estado == "Pendiente"
       ├─ Optional: VeterinarioPreferidoId == cita.VeterinarioId OR null
       ├─ OrderBy: FechaCreacion ASC
       └─ FirstOrDefault:
            ├─ entry.Estado = "Notificada"
            ├─ entry.FechaNotificacion = DateTime.UtcNow
            └─ NotificarListaEsperaDisponibleAsync(entry, cita)
```

### 2h Reminder Flow
```
CitaStatusService (every 5 min) →
  ├─ [existing] 24h window: 23h-25h from now
  ├─ [NEW] 2h window: 1h-3h from now
  │    ├─ Query Citas with Estado == "Confirmada" && FechaHora in [1h, 3h]
  │    ├─ Deduplicate: check Notificaciones for existing "Recordatorio" + URL
  │    └─ Call NotificarRecordatorioCitaAsync(cita)
  └─ [existing] Mark NoAsistio, auto-complete, expire reservations
```

---

## 4. Error Handling

- **Waitlist notification failure**: Logged but does not block the cancellation. Cancellation is already committed.
- **2h reminder failure**: Logged per-cita. Other citas continue processing.
- **Concurrent cancel race**: UnitOfWork transaction ensures atomic state change. Waitlist notification is post-commit side-effect.
