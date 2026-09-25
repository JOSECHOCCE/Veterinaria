# Requisitos No Funcionales — VetCare Pro (Final)

Convención: `RNF-XXX`.

## Seguridad
- RNF-001: Contraseñas con hash seguro (bcrypt/argon2).
- RNF-002: Control de acceso basado en los 3 roles (RBAC) en cada endpoint.
- RNF-003: Toda comunicación sobre HTTPS.
- RNF-004: Cumplir principios de protección de datos personales (minimización, acceso restringido, exportar/anonimizar datos a solicitud).
- RNF-005: Validar y sanear entradas (prevenir SQL injection, XSS).

## Rendimiento
- RNF-006: Páginas principales (agenda, triaje, POS de botica) cargan en menos de 2 segundos.
- RNF-007: Actualización de cola de triaje en tiempo real, latencia menor a 3 segundos.

## Disponibilidad y Confiabilidad
- RNF-008: Respaldo automático diario de la base de datos.
- RNF-009: Registro de logs de errores.
- RNF-010: Ante fallo de servicio externo (WhatsApp/email), continuar operando y reintentar sin bloquear el flujo clínico o de venta.

## Usabilidad
- RNF-011: Interfaz responsive (escritorio, tablet, móvil).
- RNF-012: Formularios críticos (check-in, cobro, venta de botica) completables en menos de 5 pasos.
- RNF-013: Mensajes de error claros en español.

## Escalabilidad y Mantenibilidad
- RNF-014: Backend y frontend desacoplados (API REST o similar).
- RNF-015: Pruebas automatizadas mínimas en lógica crítica (cobros, stock, botica con receta, citas, concurrencia).
- RNF-016: Despliegue reproducible vía Docker.
- RNF-017: Modelo de roles y permisos diseñado de forma extensible (agregar un rol futuro no debe requerir rediseño).

## Cumplimiento y Datos
- RNF-018: Formato de comprobante configurable según país de despliegue.
- RNF-019: Trazabilidad obligatoria en manejo de medicamentos con receta obligatoria.
- RNF-020: Retención mínima de historiales clínicos de 5 años desde la última atención de la mascota, configurable si el país de despliegue exige otro plazo.
- RNF-021: Ante solicitud de eliminación de datos antes del período de retención, el sistema debe anonimizar (no eliminar) los datos personales del cliente, conservando el historial clínico.
- RNF-022: Bloquear la eliminación física de un historial clínico antes de cumplir el período mínimo de retención, incluso ante intento del Administrador.

## Concurrencia e Integridad Transaccional
- RNF-023: Toda operación de descuento de stock debe ejecutarse dentro de una transacción atómica con bloqueo de fila, verificando disponibilidad justo antes de confirmar.
- RNF-024: Toda operación de cobro debe usar una clave de idempotencia para prevenir duplicados por doble clic o reintento de red.
