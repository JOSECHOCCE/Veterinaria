---
name: vetcare-agenda
description: Lógica completa de agenda y citas de VetCare. Estados, transiciones válidas, cálculo de disponibilidad, reglas de negocio. Usar cuando toques cualquier lógica relacionada con citas, horarios o disponibilidad.
category: specific
agents: [backend]
triggers:
  backend: "Trabajar con lógica de citas, estados, disponibilidad"
---

## Cuándo usar esta skill
- Implementar lógica de creación de citas
- Calcular bloques disponibles
- Implementar transiciones de estado
- Trabajar con horarios de clínica o veterinarios
- Implementar reserva temporal

---

## Estados de una Cita

```text
ReservaTemporal → PendienteConfirmacion → Confirmada → EnEspera → EnAtencion → Completada
                                        → Rechazada
                                        → Cancelada
                                        → PendienteAsignacion → Confirmada
                       Confirmada → Reprogramada → Confirmada
                       Confirmada → NoAsistio
```

| Estado | Quién puede establecerlo |
|--------|--------------------------|
| `ReservaTemporal` | Sistema (automático al elegir bloque) |
| `PendienteConfirmacion` | Sistema (al enviar solicitud desde portal) |
| `PendienteAsignacion` | Recepcionista, Admin |
| `Confirmada` | Recepcionista, Admin |
| `EnEspera` | Recepcionista (al registrar llegada) |
| `EnAtencion` | Veterinario (al iniciar atención) |
| `Completada` | Sistema (al cerrar atención clínica) |
| `Cancelada` | Cliente (≥2h antes), Recepcionista, Admin |
| `Rechazada` | Recepcionista, Admin |
| `Reprogramada` | Recepcionista, Admin |
| `NoAsistio` | Recepcionista (15min después de la hora) |

---

## Transiciones válidas (REQUIRED)

```csharp
public static class TransicionesValidas
{
    public static readonly Dictionary<string, List<string>> Mapa = new()
    {
        [EstadoCita.ReservaTemporal] = new() {
            EstadoCita.PendienteConfirmacion,
            EstadoCita.Libre // expiró
        },
        [EstadoCita.PendienteConfirmacion] = new() {
            EstadoCita.Confirmada,
            EstadoCita.Rechazada,
            EstadoCita.Cancelada,
            EstadoCita.PendienteAsignacion
        },
        [EstadoCita.PendienteAsignacion] = new() {
            EstadoCita.Confirmada,
            EstadoCita.Cancelada,
            EstadoCita.Rechazada
        },
        [EstadoCita.Confirmada] = new() {
            EstadoCita.EnEspera,
            EstadoCita.EnAtencion,
            EstadoCita.Cancelada,
            EstadoCita.Reprogramada,
            EstadoCita.NoAsistio
        },
        [EstadoCita.Reprogramada] = new() {
            EstadoCita.Confirmada,
            EstadoCita.Cancelada
        },
        [EstadoCita.EnEspera] = new() {
            EstadoCita.EnAtencion,
            EstadoCita.Cancelada,
            EstadoCita.NoAsistio
        },
        [EstadoCita.EnAtencion] = new() {
            EstadoCita.Completada,
            EstadoCita.Cancelada // solo admin, excepcional
        }
        // Completada, Cancelada, Rechazada, NoAsistio → estados finales
    };

    public static bool EsValida(string estadoActual, string estadoNuevo)
        => Mapa.TryGetValue(estadoActual, out var permitidos)
           && permitidos.Contains(estadoNuevo);
}
```

---

## Cálculo de disponibilidad (REQUIRED)

Un bloque es válido SOLO si cumple TODAS estas condiciones:

```csharp
// Validaciones en orden
bool bloqueValido =
    dentroDeHorarioClinica &&       // horario general del establecimiento
    dentroDeHorarioVeterinario &&   // disponibilidad del veterinario
    noCruzaConCitaExistente &&      // sin solapamiento con otra cita activa
    noCruzaConBloqueoManual &&      // sin bloqueo registrado
    servicioActivo &&               // servicio no desactivado
    clienteActivo &&                // cliente no inactivo
    mascotaActiva &&                // mascota no inactiva
    fechaNoEsPasada;                // no puede agendar en el pasado
```

- NEVER: permitir al cliente escribir una hora manualmente
- ALWAYS: el sistema genera los bloques y el cliente solo elige

---

## Reserva temporal (REQUIRED)

```csharp
// Al seleccionar un bloque:
// 1. Crear Cita en estado ReservaTemporal
// 2. Registrar DateTime de expiración = Now + 5 minutos
// 3. Si el cliente completa → pasar a PendienteConfirmacion
// 4. Si expira → liberar el bloque (eliminar ReservaTemporal o marcar Libre)

public class ReservaTemporal
{
    public int CitaId { get; set; }
    public DateTime ExpiraEn { get; set; } = DateTime.UtcNow.AddMinutes(5);

    public bool HaExpirado() => DateTime.UtcNow > ExpiraEn;
}
```

---

## Reglas de cancelación (REQUIRED)

```csharp
// Cliente puede cancelar SOLO si:
bool clientePuedeCancelar =
    cita.ClienteId == clienteActualId &&           // es su cita
    cita.Estado != EstadoCita.EnAtencion &&        // no está en atención
    cita.FechaHora > DateTime.Now.AddHours(2);     // al menos 2h de anticipación

// Recepcionista y Admin pueden cancelar en cualquier estado
// salvo Completada, Cancelada, Rechazada, NoAsistio (estados finales)
bool esEstadoFinal = new[]
{
    EstadoCita.Completada,
    EstadoCita.Cancelada,
    EstadoCita.Rechazada,
    EstadoCita.NoAsistio
}.Contains(cita.Estado);
```

---

## Reglas de solapamiento (REQUIRED)

```csharp
// Un veterinario NO puede tener dos citas activas que se crucen
// Una mascota NO puede tener dos citas activas en el mismo bloque

bool haySolapamiento = citasActivas.Any(c =>
    c.VeterinarioId == veterinarioId &&
    c.FechaHora < nuevaFechaFin &&
    c.FechaHoraFin > nuevaFechaInicio &&
    !estadosFinales.Contains(c.Estado));
```

---

## Checklist al trabajar con citas

- [ ] Validar que la transición de estado es permitida antes de guardar
- [ ] Verificar solapamiento antes de confirmar
- [ ] Verificar que el servicio, cliente y mascota están activos
- [ ] Registrar auditoría en reprogramaciones y cancelaciones
- [ ] El cliente nunca puede escribir una hora manualmente
- [ ] Una cita en `EnAtencion` no puede cancelarse desde el portal
