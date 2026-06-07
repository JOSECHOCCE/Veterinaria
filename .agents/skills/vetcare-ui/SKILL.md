---
name: vetcare-ui
description: Componentes, vistas y estructura del frontend de VetCare. Diseño profesional no genérico, conexión con API, estructura por rol. Usar cuando crees o modifiques cualquier componente o vista del frontend.
category: specific
agents: [frontend]
triggers:
  frontend:
    - "Crear o modificar una vista (página completa)"
    - "Trabajar en el portal del cliente"
---

## Cuándo usar esta skill
- Crear o modificar una vista (página completa)
- Crear componentes específicos de VetCare
- Conectar una vista con el API
- Diseñar el layout de un panel por rol

---

## Identidad visual de VetCare (REQUIRED)

- NEVER: UI que parezca generada por IA (colores planos, cards idénticas, sans-serif genérica)
- ALWAYS: Paleta coherente con identidad veterinaria (verde salud, azul confianza, blanco limpio)
- ALWAYS: Tipografía con personalidad (no Inter/Roboto por defecto)
- ALWAYS: Estados visuales claros para cada estado de cita (color + ícono + texto)

```text
Estados de cita → colores sugeridos:
PendienteConfirmacion → amarillo  🟡
Confirmada            → verde     🟢
EnEspera              → azul      🔵
EnAtencion            → violeta   🟣
Completada            → gris      ⚫
Cancelada             → rojo      🔴
Rechazada             → rojo      🔴
NoAsistio             → naranja   🟠
Reprogramada          → celeste   🩵
```

---

## Paneles por rol

### Portal del Cliente (`/portal-cliente`)
```text
Vistas:
├── PortalClienteView     → dashboard: próximas citas + mascotas + alertas
├── MisMascotasView       → lista de mascotas activas con foto/nombre/especie
├── FichaMascotaView      → historial clínico en modo lectura
├── NuevaCitaView         → flujo de solicitud: mascota → servicio → fecha → hora
├── MisCitasView          → citas próximas + historial
├── MisPagosView          → historial de pagos + descarga comprobante
└── MiPerfilView          → editar teléfono, dirección, contraseña
```

### Panel Recepcionista (`/agenda`)
```text
Vistas:
├── AgendaView            → calendario diario/semanal con citas
├── SolicitudesPendientesView → citas pendientes de confirmación
├── ClientesView          → búsqueda y lista de clientes
├── FichaClienteView      → datos + mascotas + historial + pagos
├── NuevaCitaRecepcionView → crear cita directa (confirmada)
└── RegistrarCobroView    → cobro de cita completada
```

### Panel Veterinario (`/mi-agenda`)
```text
Vistas:
├── MiAgendaView          → citas del día asignadas al veterinario
├── AtencionView          → formulario de atención clínica
└── FichaMascotaVetView   → historial previo antes de atender
```

### Panel Administrador (`/dashboard`)
```text
Vistas:
├── DashboardView         → panel diario con métricas en tiempo real
├── ReporteCitasView      → filtros + tabla + export
├── ReportePagosView      → filtros + totales + export
├── EstadisticasView      → gráficos operativos
├── UsuariosView          → gestión de usuarios internos
├── ServiciosView         → catálogo de servicios
└── HorariosView          → configuración de horarios
```

---

## Estructura de componentes atómicos

```text
components/
├── common/
│   ├── Spinner.tsx           → loading state
│   ├── ErrorMessage.tsx      → error state
│   ├── EmptyState.tsx        → empty state
│   ├── ConfirmModal.tsx      → confirmación de acciones
│   └── PageHeader.tsx        → título + breadcrumb
├── citas/
│   ├── CitaCard.tsx          → tarjeta resumen de una cita
│   ├── CitaEstadoBadge.tsx   → badge de color por estado
│   ├── CalendarioAgenda.tsx  → vista de agenda
│   └── BloqueHorario.tsx     → bloque seleccionable de hora
├── mascotas/
│   ├── MascotaCard.tsx       → tarjeta de mascota
│   └── FichaMascotaPanel.tsx → panel de historial
├── clientes/
│   └── ClienteSearchBar.tsx  → búsqueda en tiempo real
└── pagos/
    └── ComprobanteButton.tsx → botón descarga PDF
```

---

## Flujo Nueva Cita — Cliente (REQUIRED)

```typescript
// NuevaCitaView.tsx — pasos del wizard
const PASOS = {
  MASCOTA: 1,
  SERVICIO: 2,
  FECHA: 3,
  HORA: 4,
  CONFIRMAR: 5,
} as const;

// ✅ El cliente NUNCA escribe la hora manualmente
// ✅ Solo puede seleccionar bloques generados por el API
// ✅ Al seleccionar hora → llamar POST /api/citas (ReservaTemporal)
// ✅ Timer visible de 5 minutos durante la confirmación
// ✅ Si expira → redirigir a selección de hora con aviso
```

---

## Conexión con API (REQUIRED)

```typescript
// services/citas.service.ts
import api from "./api";
import type { CitaDto, CitaCreateDto, BloqueDisponibleDto } from "@/types/citas";

export async function getDisponibilidad(
  servicioId: number,
  fecha: string,
  veterinarioId?: number
): Promise<BloqueDisponibleDto[]> {
  const { data } = await api.get("/citas/disponibilidad", {
    params: { servicioId, fecha, veterinarioId },
  });
  return data;
}

export async function crearCita(dto: CitaCreateDto): Promise<CitaDto> {
  const { data } = await api.post("/citas", dto);
  return data;
}

export async function cancelarCita(id: number, motivo: string): Promise<void> {
  await api.patch(`/citas/${id}/cancelar`, { motivo });
}
```

---

## Tipos TypeScript del frontend

```typescript
// types/citas.ts
const ESTADO_CITA = {
  RESERVA_TEMPORAL: "ReservaTemporal",
  PENDIENTE_CONFIRMACION: "PendienteConfirmacion",
  PENDIENTE_ASIGNACION: "PendienteAsignacion",
  CONFIRMADA: "Confirmada",
  EN_ESPERA: "EnEspera",
  EN_ATENCION: "EnAtencion",
  COMPLETADA: "Completada",
  CANCELADA: "Cancelada",
  RECHAZADA: "Rechazada",
  REPROGRAMADA: "Reprogramada",
  NO_ASISTIO: "NoAsistio",
} as const;

export type EstadoCita = (typeof ESTADO_CITA)[keyof typeof ESTADO_CITA];

export interface CitaDto {
  id: number;
  fechaHora: string;
  estado: EstadoCita;
  motivo?: string;
  esUrgencia: boolean;
  mascota: MascotaResumenDto;
  servicio: ServicioResumenDto;
  veterinario?: VeterinarioResumenDto;
}

export interface BloqueDisponibleDto {
  fechaHora: string;
  fechaHoraFin: string;
  veterinarioId?: number;
  veterinarioNombre?: string;
}
```

---

## Checklist de UI antes de hacer commit

- [ ] Componente maneja los 3 estados: loading, error, data
- [ ] Ningún componente llama al API directamente (usa services/)
- [ ] Estados de cita con color + ícono correctos
- [ ] Flujo de nueva cita no permite hora manual
- [ ] Vista es responsive (escritorio + tablet)
- [ ] No se ve genérica (validar paleta, tipografía, espaciado)
- [ ] Rutas protegidas con guard de rol correcto
