# Backlog Priorizado — VetCare Pro (Final)

> Documento vivo, priorizado con MoSCoW. Cada sprint corre bajo el ciclo SDD: explore → propose → spec → design → tasks → apply → verify → archive.

## Sprint 0 — Fundacional
- Setup del proyecto (backend + frontend + Docker).
- Autenticación y los 3 roles (RF-030, RNF-001, RNF-002).
- Modelo de base de datos inicial (clientes, mascotas, usuarios, catálogo de servicios, veterinarios, consultorios).

## Sprint 1 — Clientes, Agenda, Veterinarios y Consultorios (MUST)
- HU-001 Registrar cliente y mascota
- HU-021 Configurar horario del veterinario
- HU-022 Asignar especialidades
- HU-026 Configurar espacios físicos
- HU-002 Agendar cita (respetando veterinario + consultorio)
- HU-023, HU-024, HU-025, HU-027, HU-028, HU-029

## Sprint 2 — Notificaciones y Cancelaciones (MUST)
- HU-003 Notificación y recordatorio automático
- HU-004 Cancelación con lista de espera

## Sprint 3 — Check-in y Triaje (MUST)
- HU-005 Check-in del paciente
- HU-006 Registro de triaje

## Sprint 4 — Consulta Clínica (MUST)
- HU-007 Consulta médica SOAP
- HU-008 Presupuesto y consentimiento
- HU-009 Receta digital conectada a inventario

## Sprint 5 — Inventario y Reorden (MUST)
- HU-030, HU-031, HU-032, HU-033 (Punto de reorden dinámico)
- HU-038 Registro de mermas
- HU-015 Alerta de stock bajo/vencer

## Sprint 6 — Caja, Pagos y Concurrencia (MUST — riesgo alto)
- HU-010 Orden de cobro automática
- HU-011 Cobro con pago mixto
- HU-012 Descuento de stock con transacción atómica (concurrencia)
- HU-034, HU-035, HU-036, HU-037 (Pagos Yape/Plin — Opción A)

## Sprint 7 — Botica / Venta Directa (MUST)
- HU-013 Venta directa sin receta
- HU-014 Bloqueo de venta con receta obligatoria

## Sprint 8 — Post-atención (SHOULD)
- HU-016 Notificación post-atención
- HU-017 Recordatorio de próxima vacuna

## Sprint 9 — Seguridad, Reportes y Cumplimiento (MUST/SHOULD)
- HU-018 Control de acceso por rol
- HU-019 Reporte de ingresos separado
- HU-039 Anonimización de datos de cliente (RNF-021, RNF-022)
- Auditoría básica (RF-032)

## Sprint 10 — Pulido y Despliegue (MUST)
- Responsive design (RNF-011)
- Pruebas automatizadas mínimas, incluyendo casos de concurrencia (RNF-015)
- Backup automático (RNF-008)
- Despliegue Docker productivo (RNF-016)
- README comercial, capturas, demo

## Backlog futuro (fuera del MVP)
- Rol Contador, rol Asistente separado, rol Super Admin (multi-tenant).
- Integración de pasarela de pago con QR dinámico/webhook (Niubiz/Izipay/Culqi).
- Multi-sede e inventario multi-ubicación.
- Hospitalización/internamiento completo.
- Telemedicina.
- Facturación electrónica avanzada por país.

## Definition of Done (por historia)
1. Cumple los criterios Given/When/Then.
2. Tiene al menos una prueba automatizada de la lógica crítica.
3. Pasó revisión de código (lens correspondiente: readability/reliability/resilience/risk).
4. Desplegada en entorno de pruebas y verificada manualmente.
5. Documentación actualizada si hubo cambio de comportamiento.

## Deuda de especificación — Estado final
Todas las áreas identificadas durante el diseño quedaron resueltas e integradas en `requisitos-funcionales.md` y `requisitos-no-funcionales.md`:
1. ✅ Pagos Yape/Plin → Opción A (registro manual verificado) para el MVP.
2. ✅ Concurrencia en caja/stock → transacción atómica + idempotencia.
3. ✅ Consultorios físicos → recurso reservable (Módulo 13).
4. ✅ Punto de reorden dinámico → fórmula ROP implementada.
5. ✅ Ubicación física del stock → una sola ubicación lógica para el MVP (no multi-sede), con manejo de estados/mermas.
6. ✅ Retención legal de historiales → mínimo 5 años, con anonimización en vez de eliminación anticipada.
