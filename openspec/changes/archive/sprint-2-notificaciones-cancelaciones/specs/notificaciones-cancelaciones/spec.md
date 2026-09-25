# Specification: Sprint 2 — Notificaciones y Cancelación con Lista de Espera

- **Domain**: `notificaciones-cancelaciones`
- **Change Name**: `sprint-2-notificaciones-cancelaciones`
- **Target Stories**: `HU-003`, `HU-004`

---

## 1. New Entity: ListaEspera

```csharp
public class ListaEspera
{
    public int Id { get; set; }
    public int MascotaId { get; set; }
    public int ServicioId { get; set; }
    public int? VeterinarioPreferidoId { get; set; }
    public DateTime FechaDeseada { get; set; }
    public DateTime FechaDeseadaFin { get; set; }
    public string Estado { get; set; } = "Pendiente"; // Pendiente, Notificada, Convertida, Expirada, Cancelada
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    public DateTime? FechaNotificacion { get; set; }

    // Navigation
    public virtual Mascota Mascota { get; set; } = default!;
    public virtual Servicio Servicio { get; set; } = default!;
    public virtual Veterinario? VeterinarioPreferido { get; set; }
}
```

---

## 2. Gherkin Scenarios

### Scenario 2.1: Recordatorio 2h antes (HU-003, RF-007)
```gherkin
Given una cita Confirmada con FechaHora dentro de las próximas 1-3 horas
And no se ha enviado previamente un recordatorio con Titulo "Recordatorio" para esa cita
When el CitaStatusService ejecuta su ciclo
Then se crea una Notificacion con Titulo "⏰ Recordatorio de Cita" para el UsuarioId del tutor
And se envía correo si usuario.RecibirRecordatorios == true
```

### Scenario 2.2: Notificación inmediata al confirmar (HU-003, RF-006)
```gherkin
Given una cita en estado PendienteConfirmacion
When se confirma la cita (estado → Confirmada)
Then se llama NotificarCitaConfirmadaAsync
And el tutor recibe Notificacion con Tipo "Success"
And se envía correo al email del tutor
```
> **Nota**: Este escenario ya está implementado. Se verifica que sigue funcionando.

### Scenario 2.3: Cancelación libera horario (HU-004, RF-008)
```gherkin
Given una cita Confirmada
When el cliente cancela la cita (CancelarCitaAsync)
Then cita.Estado == "Cancelada"
And el horario del veterinario queda disponible para nuevas reservas
```

### Scenario 2.4: Cancelación notifica a lista de espera (HU-004, RF-009)
```gherkin
Given una cita Confirmada para ServicioId=1 el 2026-08-05
And existe una ListaEspera con ServicioId=1, FechaDeseada <= 2026-08-05 <= FechaDeseadaFin, Estado="Pendiente"
When el cliente cancela la cita
Then la ListaEspera.Estado cambia a "Notificada"
And ListaEspera.FechaNotificacion se asigna
And el tutor de la mascota en lista recibe una Notificacion tipo "Info" con título "📋 Cupo Disponible"
And se envía correo al tutor
```

### Scenario 2.5: Cancelación sin lista de espera (HU-004)
```gherkin
Given una cita Confirmada para ServicioId=1 el 2026-08-05
And NO existe ListaEspera pendiente para ese servicio/fecha
When el cliente cancela la cita
Then cita.Estado == "Cancelada"
And no se genera notificación de lista de espera
```

### Scenario 2.6: CRUD de lista de espera
```gherkin
Given un cliente autenticado con mascota registrada
When POST /api/lista-espera con MascotaId, ServicioId, FechaDeseada, FechaDeseadaFin
Then se crea registro con Estado "Pendiente"
And retorna 201 Created

Given una entrada en lista de espera con Estado "Pendiente"
When DELETE /api/lista-espera/{id}
Then el Estado cambia a "Cancelada"
```

---

## 3. API Contracts

### POST /api/lista-espera
```json
{
  "mascotaId": 1,
  "servicioId": 2,
  "veterinarioPreferidoId": null,
  "fechaDeseada": "2026-08-05",
  "fechaDeseadaFin": "2026-08-10"
}
```
Response: `201 Created` with body `{ "id": 1, "estado": "Pendiente", ... }`

### GET /api/lista-espera?mascotaId=1
Response: `200 OK` with array of entries.

### DELETE /api/lista-espera/{id}
Response: `204 No Content` on success.
