# Historias de Usuario — VetCare Pro (Parte 1: HU-001 a HU-020)

Formato: Given/When/Then. Roles: Administrador, Veterinario/Operador, Cliente.

## HU-001 — Registrar cliente y mascota
Como Administrador o Veterinario/Operador, quiero registrar un cliente y su mascota, para poder agendarle citas.
- Given que estoy en "Nuevo cliente"
- When ingreso nombre, teléfono y datos de la mascota
- And presiono "Guardar"
- Then el cliente y su mascota quedan registrados
- And puedo buscarlos por nombre o teléfono

## HU-002 — Agendar una cita
Como Veterinario/Operador, quiero agendar una cita, para organizar la atención del día.
- Given un cliente y mascota registrados
- When selecciono servicio, fecha y hora disponibles
- And confirmo
- Then la cita queda registrada
- And el sistema rechaza si el horario ya está ocupado

## HU-003 — Notificación y recordatorio automático
Como Cliente, quiero recibir confirmación y recordatorio, para no olvidar mi cita.
- Given que se confirmó una cita
- Then recibo notificación inmediata
- And recordatorio 24h antes
- And recordatorio 2h antes

## HU-004 — Cancelación con lista de espera
Como Cliente, quiero cancelar mi cita, para liberar el horario.
- Given una cita confirmada
- When el cliente cancela
- Then el horario queda libre
- And si hay lista de espera, se notifica al siguiente

## HU-005 — Check-in del paciente
Como Veterinario/Operador, quiero marcar check-in, para que el paciente pase a la cola.
- Given una cita confirmada para hoy
- When presiono "Check-in"
- Then el estado cambia a "En sala de espera"
- And aparece en la cola de triaje

## HU-006 — Registro de triaje
Como Veterinario/Operador, quiero registrar signos vitales, para priorizar la atención.
- Given un paciente en sala de espera
- When registro peso, temperatura, FC y nivel de urgencia
- Then la cola se reordena automáticamente

## HU-007 — Consulta médica SOAP
Como Veterinario/Operador, quiero registrar la consulta en formato SOAP, para mantener historial clínico claro.
- Given un paciente en cola
- When completo Subjetivo, Objetivo, Análisis y Plan
- Then el registro queda en el historial de la mascota
- And veo consultas anteriores

## HU-008 — Presupuesto y consentimiento
Como Veterinario/Operador, quiero generar presupuesto y consentimiento, para evitar disputas de cobro.
- Given un diagnóstico con procedimiento de costo relevante
- When genero presupuesto y el cliente acepta/firma
- Then el sistema habilita continuar con el tratamiento
- And queda registro del consentimiento

## HU-009 — Receta digital conectada a inventario
Como Veterinario/Operador, quiero emitir receta desde el stock disponible, para automatizar cobro y descuento.
- Given una consulta en curso
- When agrego medicamentos del inventario a la receta
- Then el sistema valida stock disponible
- And la receta se vincula a la orden de cobro

## HU-010 — Generación automática de orden de cobro
Como sistema, quiero generar la orden de cobro al finalizar consulta, para que caja no la arme manualmente.
- Given que se presiona "Finalizar consulta"
- Then se genera orden de cobro pendiente con consulta + medicamentos + procedimientos

## HU-011 — Cobro con pago mixto
Como Veterinario/Operador (en caja), quiero cobrar aceptando distintos medios de pago, para completar la atención.
- Given una orden de cobro pendiente
- When registro el pago (efectivo, tarjeta, Yape/Plin o combinación)
- Then se emite el comprobante
- And la cita cambia a "Completada/Pagada"

## HU-012 — Descuento automático de stock
Como sistema, quiero descontar stock al confirmar pago, para mantener el inventario exacto.
- Given una orden de cobro con medicamentos
- When se confirma el pago dentro de una transacción atómica con bloqueo de fila
- Then el stock se reduce y queda registro en Kardex
- And si dos operaciones intentan tocar el mismo producto a la vez, la segunda espera o recibe error claro de "sin stock"

## HU-013 — Venta directa de botica sin receta
Como Veterinario/Operador, quiero vender un producto de venta libre sin cita previa, para atender ventas de mostrador.
- Given un producto marcado como "venta libre"
- When lo busco en el punto de venta y confirmo el cobro
- Then se descuenta el stock automáticamente
- And se emite el comprobante correspondiente

## HU-014 — Bloqueo de venta directa con receta obligatoria
Como sistema, quiero bloquear la venta de productos con receta obligatoria sin receta válida, para cumplir la normativa.
- Given un producto marcado "con receta obligatoria"
- When intento venderlo sin receta vinculada
- Then el sistema bloquea la venta
- And solicita vincular una receta activa emitida por el veterinario

## HU-015 — Alerta de stock bajo o por vencer
Como Administrador, quiero recibir alertas de stock, para reabastecer a tiempo.
- Given productos en inventario
- When un producto llega a su punto de reorden calculado o vence en 30 días
- Then el sistema muestra alerta en el panel

## HU-016 — Notificación post-atención
Como Cliente, quiero recibir receta y resumen, para tener registro de la atención.
- Given que se completó y pagó la consulta
- Then recibo por WhatsApp/email la receta en PDF y el resumen

## HU-017 — Recordatorio de próxima vacuna
Como Cliente, quiero recibir recordatorio de vacuna, para no olvidar el refuerzo.
- Given una consulta con vacuna aplicada y esquema de refuerzo
- Then el sistema programa el recordatorio automáticamente

## HU-018 — Control de acceso por rol
Como Administrador, quiero que cada rol vea solo sus funciones, para mantener seguridad y orden.
- Given un usuario con rol "Veterinario/Operador"
- When intenta acceder a gestión de usuarios (función de Administrador)
- Then el sistema le niega el acceso

## HU-019 — Reporte de ingresos separado por línea de negocio
Como Administrador, quiero ver ingresos separados de consultas y botica, para entender de dónde viene el dinero.
- Given ventas de consultas y de botica registradas
- When selecciono un rango de fechas
- Then veo el total de ingresos desglosado por consultas y por botica

## HU-020 — Agendar servicio del catálogo (ej. grooming)
Como Cliente, quiero agendar cualquier servicio del catálogo (no solo consulta médica), para reservar baño, corte u otro servicio.
- Given que el Administrador configuró el servicio "Grooming" en el catálogo
- When el cliente agenda ese servicio como cualquier otra cita
- Then el Veterinario/Operador puede marcarlo como completado igual que una consulta

## HU-021 — Configurar horario propio del veterinario
Como Administrador, quiero configurar el horario semanal de cada veterinario, para que la agenda respete su disponibilidad real.
- Given un veterinario registrado en el sistema
- When configuro sus bloques de horario por día (ej. lunes 9:00-13:00)
- Then ese horario queda guardado como su disponibilidad base
- And no afecta el horario de otros veterinarios

## HU-022 — Asignar especialidad(es) a un veterinario
Como Administrador, quiero asignar una o más especialidades a cada veterinario, para ofrecer servicios específicos correctamente.
- Given un veterinario registrado
- When le asigno una o más especialidades (ej. dermatología, cirugía)
- Then esas especialidades quedan visibles al momento de agendar servicios relacionados

## HU-023 — Agendar respetando disponibilidad real
Como Cliente o Veterinario/Operador, quiero ver solo horarios realmente disponibles, para no generar conflictos de agenda.
- Given un veterinario con horario base, citas ya tomadas y posibles bloqueos (vacaciones/permisos)
- When intento agendar una cita con él
- Then el sistema solo muestra los horarios efectivamente libres
- And la duración del bloque considera el servicio y especialidad solicitados

## HU-024 — Filtrar veterinarios por especialidad
Como Cliente, quiero filtrar veterinarios por especialidad, para encontrar al profesional adecuado para mi mascota.
- Given varios veterinarios con distintas especialidades registradas
- When el cliente busca "dermatología" en el filtro de agenda
- Then solo se muestran los veterinarios con esa especialidad y su disponibilidad

## HU-025 — Operación simplificada con un solo veterinario
Como Administrador de una clínica pequeña, quiero que el sistema funcione sin configuración compleja si solo hay un veterinario, para no perder tiempo en configuración innecesaria.
- Given una clínica con un único veterinario registrado
- When se agenda una cita
- Then el sistema no exige seleccionar veterinario ni especialidad (los asume automáticamente)
- And el flujo de agendamiento se mantiene igual de simple que con múltiples veterinarios

## HU-026 — Configurar espacios físicos de la clínica
Como Administrador, quiero configurar cuántos consultorios, salas de procedimientos y áreas de grooming tiene mi clínica, para que el sistema los use al agendar.
- Given que estoy configurando mi clínica por primera vez
- When defino 2 consultorios, 1 sala de procedimientos y 1 área de grooming
- Then el sistema usa esa configuración para asignar espacios a cada cita

## HU-027 — Asignación automática de consultorio
Como sistema, quiero asignar automáticamente un consultorio disponible según el tipo de servicio, para evitar que el personal deba coordinarlo manualmente.
- Given una cita de "Consulta general" siendo agendada
- When se confirma la cita
- Then el sistema asigna automáticamente un consultorio libre en ese horario
- And si el servicio es "Cirugía menor", asigna la sala de procedimientos en vez de un consultorio normal

## HU-028 — Evitar doble uso de un consultorio
Como sistema, quiero impedir que dos citas usen el mismo consultorio a la misma hora, para evitar conflictos físicos reales.
- Given dos veterinarios con disponibilidad de horario a las 10:00am
- When ambos intentan agendar una cita a esa hora y solo queda 1 consultorio libre
- Then el sistema solo permite confirmar la segunda cita en otro horario o consultorio disponible

## HU-029 — Ver ocupación de espacios físicos
Como Administrador, quiero ver qué consultorios están ocupados y cuáles libres en tiempo real, para gestionar mejor el flujo del día.
- Given citas en curso en distintos consultorios
- When abro el panel de ocupación
- Then veo el estado de cada consultorio (libre/ocupado) y qué cita lo está usando

## HU-030 — Cálculo automático del punto de reorden
Como sistema, quiero calcular el punto de reorden de cada producto según su consumo real, para alertar a tiempo sin depender de un número fijo adivinado.
- Given un producto con historial de ventas de al menos 30 días
- When el sistema calcula el consumo diario promedio
- Then calcula automáticamente su Punto de Reorden usando ROP = (consumo promedio × lead time) + stock de seguridad

## HU-031 — Configurar lead time por proveedor
Como Administrador, quiero registrar cuánto tarda cada proveedor en entregar, para que el cálculo de reorden sea preciso.
- Given un proveedor registrado
- When configuro que tarda en promedio 4 días en entregar (con un máximo histórico de 6 días)
- Then ese dato se usa en el cálculo del Punto de Reorden de los productos que provee

## HU-032 — Alerta de reorden automática
Como Administrador, quiero recibir una alerta cuando un producto llegue a su punto de reorden, para hacer el pedido a tiempo y no quedarme sin stock.
- Given un producto cuyo stock actual llega a su Punto de Reorden calculado
- Then el sistema muestra una alerta en el panel de inventario
- And sugiere la cantidad a pedir considerando el consumo esperado

## HU-033 — Respaldo para productos sin historial
Como Administrador, quiero definir un stock mínimo manual para productos nuevos, para no quedarme sin alertas mientras se acumula historial de ventas.
- Given un producto recién agregado sin historial de ventas
- When lo registro en inventario
- Then puedo definir manualmente un stock mínimo temporal
- And el sistema lo reemplaza automáticamente por el cálculo dinámico una vez haya suficiente historial (ej. 30 días)

## HU-034 — Registrar pago por Yape/Plin con número de operación
Como Veterinario/Operador (en caja), quiero registrar un pago de Yape o Plin ingresando el número de operación que veo en el celular del cliente, para dejar evidencia verificable del cobro.
- Given una orden de cobro pendiente
- When selecciono "Yape" o "Plin" como medio de pago
- And el cliente me muestra el voucher en su celular
- And ingreso el número de operación y el monto
- Then el pago queda registrado con ese número de operación como respaldo
- And la orden pasa a "Completada/Pagada"

## HU-035 — Marcar pago como pendiente de verificar
Como Veterinario/Operador (en caja), quiero marcar un pago como "pendiente de verificar" si no puedo confirmar el voucher en el momento, para no detener la atención al cliente.
- Given un pago por Yape/Plin donde no pude verificar el voucher completo
- When marco el pago como "pendiente de verificar" en vez de "confirmado"
- Then la orden se cierra igualmente para no bloquear la atención
- And el pago queda visible en una lista de revisión para el Administrador

## HU-036 — Revisar pagos pendientes de verificar
Como Administrador, quiero revisar los pagos marcados como "pendiente de verificar", para confirmar que realmente ingresó el dinero antes del cierre de caja.
- Given pagos marcados como "pendiente de verificar" durante el día
- When reviso el listado al cierre de caja
- Then puedo confirmar cada uno contra el estado de cuenta o app de Yape/Plin de la clínica
- And marcar cada uno como "verificado" o "rechazado" (si nunca llegó el dinero)

## HU-037 — Cierre de caja con desglose por medio de pago
Como Administrador, quiero ver el cierre de caja del día separado por medio de pago, para conciliar fácilmente contra la cuenta bancaria.
- Given ventas del día registradas con distintos medios de pago
- When genero el cierre de caja
- Then veo el total de efectivo, tarjeta, Yape y Plin por separado
- And veo quién (qué cajero) registró cada cobro

## HU-038 — Registrar merma de producto dañado o vencido
Como Veterinario/Operador o Administrador, quiero registrar un producto dañado, roto o vencido como merma, para que no se confunda con una venta ni quede fantasma en el inventario.
- Given un producto que se rompió, venció o se dañó y ya no puede venderse
- When lo registro como "Merma" indicando el motivo (dañado, vencido, roto)
- Then el sistema descuenta esa cantidad del stock disponible
- And el movimiento queda registrado en el Kardex como "Merma", separado de las ventas
- And el reporte de inventario y el cierre de caja no confunden esta pérdida con un ingreso o una venta real

## HU-039 — Solicitud de anonimización de datos de cliente
Como Cliente, quiero poder solicitar que se eliminen mis datos personales, para ejercer mi derecho de protección de datos, sin perder la integridad del historial clínico de mi mascota.
- Given un cliente que solicita la eliminación de sus datos personales
- When han pasado menos de 5 años desde la última atención de su mascota
- Then el sistema anonimiza sus datos personales (nombre, teléfono, email) en vez de eliminar el historial clínico
- And el historial clínico de la mascota se conserva íntegro para fines legales y de continuidad médica
- And si ya pasaron los 5 años de retención mínima, el Administrador puede autorizar la eliminación física completa
