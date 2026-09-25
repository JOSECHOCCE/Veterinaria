# Requisitos Funcionales — VetCare Pro (Final consolidado)

Convención: `RF-XXX`. 13 módulos, ~65 requisitos. Cada uno debe ser verificable.

## Módulo 1 — Clientes y Mascotas
- RF-001: Registrar cliente (nombre, teléfono, email, dirección).
- RF-002: Asociar una o más mascotas a un cliente (nombre, especie, raza, edad, peso, sexo).
- RF-003: Editar y desactivar (no eliminar físicamente) clientes y mascotas.
- RF-004: Buscar clientes/mascotas por nombre, teléfono o documento.

## Módulo 2 — Agendamiento de Citas
- RF-005: Crear cita (cliente, mascota, veterinario, servicio, fecha/hora), validando disponibilidad real del veterinario (Módulo 12) y del consultorio (Módulo 13).
- RF-006: Notificación automática (WhatsApp/email) al confirmar la cita.
- RF-007: Recordatorios automáticos 24h y 2h antes.
- RF-008: Reprogramar o cancelar cita, liberando el horario.
- RF-009: Ofrecer el cupo cancelado a lista de espera si existe.
- RF-010: Evitar doble-reserva del mismo veterinario en el mismo horario.

## Módulo 3 — Check-in y Triaje
- RF-011: Marcar "Check-in" → estado "En sala de espera".
- RF-012: Registrar signos vitales (peso, temperatura, FC, nivel de urgencia).
- RF-013: Cola de atención en tiempo real, ordenada por urgencia y hora de llegada.

## Módulo 4 — Consulta Médica (SOAP)
- RF-014: Historia clínica en formato SOAP.
- RF-015: Mostrar historial clínico previo de la mascota.
- RF-016: Emitir receta digital desde el inventario disponible.
- RF-017: Generar presupuesto y consentimiento informado antes de tratamientos de costo relevante.
- RF-018: Generar automáticamente orden de cobro pendiente al finalizar la consulta.

## Módulo 5 — Caja y Facturación (incl. Pagos y Concurrencia)
- RF-019: Ver órdenes de cobro pendientes del día.
- RF-020: Registrar el pago indicando medio exacto: efectivo, tarjeta, Yape (manual), Plin (manual), otra billetera.
- RF-020a: Para Yape/Plin, ingresar número de operación/voucher como respaldo (Opción A — registro manual verificado).
- RF-020b: Permitir marcar un pago como "pendiente de verificar" si no se puede confirmar el voucher al momento.
- RF-020c (fase 2, no MVP): Integración con pasarela (QR dinámico + webhook) — pospuesta hasta justificar el costo de afiliación comercial.
- RF-020d: Generar cierre de caja diario desglosado por medio de pago.
- RF-020e: Registrar el usuario (cajero) responsable de cada cobro.
- RF-021: Descontar stock automáticamente al confirmar el pago (Kardex), dentro de una transacción atómica con bloqueo de fila (evita sobreventa por concurrencia).
- RF-021b: Cada operación de cobro/venta debe generar una clave de idempotencia para evitar duplicados por doble clic o reintentos de red.
- RF-022: Emitir comprobante (boleta/factura) al confirmar el pago.
- RF-023: Cambiar cita a "Completada/Pagada" tras el pago.

## Módulo 6 — Inventario Clínico (incl. Reorden dinámico y Mermas)
- RF-024: Registrar productos/medicamentos con stock, precio y vencimiento.
- RF-025: Calcular Punto de Reorden (ROP) dinámico: `ROP = (Consumo diario promedio × Lead time) + Stock de seguridad`, con `Stock de seguridad = (Consumo máximo × Lead time máximo) − (Consumo promedio × Lead time promedio)`.
- RF-025b: Calcular el consumo diario promedio automáticamente desde el historial de ventas (Kardex).
- RF-025c: Registrar lead time por proveedor y producto.
- RF-025d: Permitir stock mínimo fijo manual como respaldo si no hay historial suficiente (producto nuevo).
- RF-025e: Alertar automáticamente al llegar al Punto de Reorden calculado.
- RF-026: Mantener historial de movimientos de inventario (Kardex), incluyendo tipo de movimiento: Venta, Compra, Merma, Ajuste.
- RF-026b: Registrar el estado del producto: Disponible / En cuarentena / Merma / Vencido. No se maneja multi-ubicación física (solo aplica a multi-sede, fuera del MVP).

## Módulo 7 — Botica / Venta Directa (mostrador)
- RF-064: Clasificar cada producto como venta libre o venta con receta obligatoria.
- RF-065: Permitir venta directa en caja (sin cita/consulta) para productos de venta libre, tipo POS.
- RF-066: Bloquear venta directa de productos "con receta obligatoria" salvo vinculación a receta activa.
- RF-067: Buscar productos por nombre o código de barras desde el punto de venta.
- RF-068: Descontar stock automáticamente en cada venta directa (mismo Kardex, RF-021).
- RF-069: Vender productos no médicos (alimento, accesorios) desde la misma pantalla de POS.
- RF-070: Archivar digitalmente receta retenida con control de saldo despachado.
- RF-071: Guardar en cada venta con receta: veterinario prescriptor, cliente, mascota, producto, dosis, fecha.
- RF-072: Reporte de ventas de botica separado del reporte de ingresos por consultas.

## Módulo 8 — Post-atención y Seguimiento
- RF-027: Enviar automáticamente receta en PDF y resumen de consulta por WhatsApp/email.
- RF-028: Programar automáticamente recordatorio de próxima vacuna/refuerzo.
- RF-029: Enviar seguimientos programados (48h, 7 días, 30 días) según el procedimiento.

## Módulo 9 — Usuarios y Roles (3 roles)
- RF-030: Soportar 3 roles: Administrador, Veterinario/Operador, Cliente (ver `roles-y-permisos.md`).
- RF-031: Validar permiso del rol antes de cada acción (frontend Y backend).
- RF-032: Registrar auditoría de acciones críticas (check-in, prescripción, cobro, venta con receta, edición de inventario, mermas).
- RF-032b: Administrador crea/asigna rol/desactiva usuarios (nunca elimina físicamente).
- RF-032c: Autenticación individual obligatoria.
- RF-032d: El rol Cliente accede solo a un portal externo separado.

## Módulo 10 — Catálogo de Servicios
- RF-073: Administrador crea/edita servicios (nombre, duración, precio) — incluye grooming como servicio, no como rol.
- RF-074: Cualquier servicio se agenda igual que una cita médica.
- RF-075: Cualquier Veterinario/Operador puede marcar cualquier servicio como completado.

## Módulo 11 — Reportes
- RF-033: Reporte de ingresos por período, separando consultas vs. botica.
- RF-034: Reporte de citas atendidas vs. no-show.
- RF-035: Reporte de inventario (stock actual, productos por vencer, mermas registradas).

## Módulo 12 — Veterinarios, Horarios y Especialidades
- RF-076: Horario propio configurable por día de la semana, por veterinario.
- RF-077: Asignar una o varias especialidades a cada veterinario.
- RF-078: Duración estándar por servicio, variable según especialidad.
- RF-079: Mostrar solo horarios realmente disponibles (horario base − citas − bloqueos).
- RF-080: Registrar bloqueos temporales (vacaciones, permisos, capacitaciones).
- RF-081: Filtrar veterinarios disponibles por especialidad al agendar.
- RF-082: Funcionar igual con 1 solo veterinario que con varios, sin configuración innecesaria.

## Módulo 13 — Consultorios y Recursos Físicos
- RF-083: Modelar el consultorio/sala como recurso reservable, igual que el veterinario.
- RF-084: Asignar automáticamente un consultorio disponible según el tipo de servicio (consulta → consultorio; cirugía menor/odontología → sala de procedimientos; grooming → área de grooming).
- RF-085: Impedir asignar el mismo consultorio a dos citas simultáneas.
- RF-086: Administrador configura cantidad y tipo de espacios físicos (default: 2 consultorios, 1 sala de procedimientos, 1 área de grooming).

## Catálogo de servicios de referencia (para RF-073)
1. Consulta general (20 min)
2. Vacunación (15 min)
3. Desparasitación (15 min)
4. Control/seguimiento (15 min)
5. Curación de heridas menores (20 min)
6. Cirugía menor (45-60 min, sala de procedimientos)
7. Laboratorio - toma de muestra (15 min)
8. Radiología/ecografía (30 min)
9. Grooming/baño (45-60 min, área de grooming)
10. Odontología básica (30-45 min, sala de procedimientos)

## Resumen de alcance
**Total: ~65 requisitos funcionales en 13 módulos.** Todas las áreas de deuda de especificación identificadas durante el análisis (pagos, concurrencia, ubicación de stock, consultorios, reorden, retención legal) están resueltas e integradas aquí.
