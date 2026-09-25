# Visión del Producto — VetCare Pro (Final)

## ¿Qué estamos construyendo?

Un sistema web integral de gestión para clínicas veterinarias que cubre el ciclo completo de atención: desde el agendamiento de citas hasta el cobro, la venta de botica y el seguimiento post-consulta. Reemplaza cuadernos, hojas de Excel y WhatsApp desordenado con una herramienta operativa diaria real.

## ¿Para quién es?

Pensado para una **clínica veterinaria pequeña/mediana de operación única** (un solo local, no multi-sede). Roles reales del sistema:

- **Administrador**: dueño de la clínica, gestiona todo el negocio.
- **Veterinario/Operador**: atiende consultas, hace triaje, cobra en caja (1 o varias personas según el tamaño de la clínica).
- **Cliente**: dueño de mascota, agenda citas y consulta el historial desde un portal externo.

## Problema que resolvemos

- Citas perdidas por falta de recordatorios automáticos.
- Historiales clínicos dispersos o en papel.
- Cobros manuales sin trazabilidad con el stock de medicamentos.
- Venta de botica desconectada del inventario clínico, generando descuadres.
- Falta de seguimiento post-consulta.
- Falta de control real de inventario (sin punto de reorden, sin manejo de mermas).

## Propuesta de valor

"Una clínica pequeña puede operar su día completo —desde que llega el primer paciente hasta que cierra caja, incluida la venta de botica— sin salir del sistema, con datos confiables y trazables."

## Alcance del MVP

**Incluye:**
- Gestión de clientes y mascotas.
- Agenda de citas con notificación y recordatorio automático, respetando horario real por veterinario.
- Check-in y cola de triaje en tiempo real.
- Historia clínica en formato SOAP.
- Receta digital conectada a inventario.
- Venta directa de botica (con y sin receta), integrada al inventario clínico.
- Caja: cobro (efectivo, tarjeta, Yape/Plin manual verificado), descuento automático de stock, comprobante.
- Asignación automática de consultorios/salas como recurso reservable.
- Punto de reorden dinámico de inventario.
- Notificación post-atención y recordatorio de próxima vacuna.
- 3 roles: Administrador, Veterinario/Operador, Cliente.
- Catálogo de servicios configurable (consulta, vacunación, grooming, etc.).
- Retención y anonimización de historiales clínicos conforme a buenas prácticas legales.

**NO incluye en el MVP (fase 2):**
- Telemedicina / videoconsulta.
- App móvil nativa (solo web responsive).
- Múltiples sedes/sucursales (y por tanto, inventario multi-ubicación).
- Roles adicionales (Contador, Asistente separado, Super Admin) — se agregan cuando el negocio los necesite.
- Hospitalización/internamiento completo.
- Integración de pasarela de pago con QR dinámico/webhook (Niubiz/Izipay/Culqi) — queda como mejora futura; el MVP usa registro manual verificado.
- Facturación electrónica avanzada por país.

## Métricas de éxito

- Reducción de inasistencias (no-show) en al menos 30%.
- 100% de las ventas (consulta + botica) descontadas automáticamente del stock, sin descuadres.
- Cero cobros duplicados por doble clic o reintentos (idempotencia implementada).
- Tiempo de atención (puerta a puerta) medible dentro del sistema.
- Adopción: la clínica piloto opera 1 semana completa sin herramientas externas.
