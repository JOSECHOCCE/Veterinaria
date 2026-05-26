# 01. Product Requirements Document (PRD)

## Problema del Negocio
La industria veterinaria enfrenta una divergencia: los ingresos crecen por el aumento de costos, pero el volumen de visitas disminuye debido a la sensibilidad al precio de los clientes y la inflación. Además, las clínicas pierden horas valiosas por ineficiencias ocultas (como el agendamiento manual por teléfono) y sufren pérdida de pacientes entre visitas por falta de seguimiento.

## Contexto
El sector de clínicas de pequeños animales busca resiliencia económica. Depender de registros manuales y sistemas desconectados provoca conflictos de programación, mal seguimiento de inventario e historiales inaccesibles.

## Objetivo del Sistema
Diseñar e implementar una solución web centralizada para automatizar tareas operativas clave, unificar la gestión de datos (incluso entre múltiples sucursales), reducir la carga administrativa y mejorar la retención de pacientes mediante una comunicación fluida.

## Stakeholders
- Propietarios de clínicas
- Veterinarios
- Personal de recepción (CSR) y Técnicos (Vet Techs)
- Dueños de mascotas

## Usuarios Objetivo
- **Administradores:** Gestión de sucursales, reportes y métricas.
- **Veterinarios:** Acceso a historias clínicas, prescripciones y notas (SOAP).
- **Personal de Recepción:** Gestión de citas, triage, cobros y recordatorios.
- **Dueños de mascotas (Clientes):** Agendamiento en línea, acceso a historial, portal/app.

## Necesidades Detectadas
- Reducción del tiempo dedicado a atender llamadas para citas.
- Recordatorios automáticos para reducir "no-shows".
- Acceso rápido a historiales clínicos desde cualquier lugar.
- Herramientas para mejorar la retención de clientes entre visitas.
- Protección de datos sensibles contra ataques (ej. ransomware) y cumplimiento legal (RGPD/LOPD).

## Funcionalidades Esperadas
- Agendamiento en línea (Smart Appointment Scheduling).
- Recordatorios automatizados por SMS/Email (y mensajería bidireccional).
- Historias clínicas electrónicas (EHR).
- Facturación, pagos integrados e inventario en tiempo real.
- Sistema de Triage para clasificación de emergencias.
- Telemedicina (virtual service).

## Alcance MVP
- Gestión de citas (calendario y agendamiento online).
- Envío de recordatorios automáticos (SMS/Email).
- Fichas clínicas básicas y registro de pacientes/clientes.
- Triage básico de urgencias.
- Facturación básica y registro de pagos.

## Fuera de Alcance (Post-MVP)
- Inteligencia artificial avanzada para diagnóstico (ej. análisis de radiografías).
- App móvil nativa completa para dueños de mascotas.
- Integraciones complejas con laboratorios externos (ej. IDEXX) o hardware especializado en la fase inicial.

## Riesgos
- **Seguridad y Privacidad:** Robo de datos o ataques de ransomware; incumplimiento de leyes de protección de datos (RGPD).
- **Adopción:** Resistencia al cambio por parte del personal de la clínica.
- **Conectividad:** Caídas de internet que impidan el acceso al sistema (si no hay soporte offline).

## Métricas de Éxito
- Reducción del % de inasistencias (no-shows).
- Disminución del tiempo semanal empleado en agendamiento telefónico.
- Aumento en la tasa de retorno de pacientes para visitas de seguimiento/vacunación.

## Preguntas Abiertas
- ¿Se requerirá migración de datos históricos de sistemas anteriores de forma automatizada para el MVP?
- ¿Qué pasarela de pagos específica se utilizará (ej. integración con CareCredit o ScratchPay)?

# 02. Requisitos Funcionales

1. **Agendamiento en Línea**
   - *Descripción:* Los dueños de mascotas deben poder visualizar la disponibilidad y reservar citas en línea.
   - *Prioridad:* Alta
   - *Actor Involucrado:* Dueño de Mascota
   - *Criterio de Aceptación Preliminar:* El sistema muestra horas disponibles y confirma la reserva por correo/SMS inmediatamente.

2. **Gestión del Sistema de Triage**
   - *Descripción:* El sistema debe permitir al personal clasificar la urgencia del paciente según 5 niveles (Nivel 1: Reanimación, hasta Nivel 5: No Urgente).
   - *Prioridad:* Alta
   - *Actor Involucrado:* Personal de Recepción / Técnico
   - *Criterio de Aceptación Preliminar:* Se asigna un color y tiempo de espera estimado al paciente en el tablero principal según el nivel de triage.

3. **Recordatorios Automatizados**
   - *Descripción:* El sistema debe enviar notificaciones de confirmación y recordatorio vía SMS y correo electrónico antes de la cita.
   - *Prioridad:* Alta
   - *Actor Involucrado:* Sistema
   - *Criterio de Aceptación Preliminar:* Se envía un recordatorio 24 y 48 horas antes de la cita.

4. **Historia Clínica Electrónica**
   - *Descripción:* Los veterinarios deben poder ingresar notas (formato SOAP), diagnósticos y prescripciones.
   - *Prioridad:* Alta
   - *Actor Involucrado:* Veterinario
   - *Criterio de Aceptación Preliminar:* El veterinario puede crear, editar y guardar una entrada clínica vinculada a la mascota de forma segura.

5. **Gestión de Consentimiento y Privacidad**
   - *Descripción:* Se debe registrar el consentimiento explícito del cliente para el tratamiento de sus datos y envío de comunicaciones.
   - *Prioridad:* Alta
   - *Actor Involucrado:* Recepción / Dueño de Mascota
   - *Criterio de Aceptación Preliminar:* Todo cliente nuevo debe tener una casilla de verificación firmada/aceptada de consentimiento antes de guardar su perfil.

6. **Facturación y Depósitos**
   - *Descripción:* El sistema debe procesar pagos y gestionar depósitos no reembolsables para clientes nuevos o con historial de inasistencia.
   - *Prioridad:* Media
   - *Actor Involucrado:* Recepción
   - *Criterio de Aceptación Preliminar:* El sistema permite añadir cargos, aplicar depósitos previos y generar una factura final.

# 03. Requisitos No Funcionales

- **Rendimiento:** El sistema debe cargar la disponibilidad del calendario en menos de 2 segundos. Debe contar con capacidad de soporte offline o sincronización rápida tras caídas de internet.
- **Seguridad:** Los datos deben estar cifrados en reposo y en tránsito. Deben existir copias de seguridad en la nube contra amenazas (como ransomware).
- **Disponibilidad:** El sistema debe ser una solución basada en la nube (Cloud) garantizando un 99.9% de tiempo de actividad mensual.
- **Usabilidad:** La interfaz debe ser responsiva y estar optimizada para el uso en tablets (únicas en sala de examen) y computadoras de escritorio.
- **Mantenibilidad:** El código debe seguir una arquitectura modular para permitir actualizaciones rápidas y despliegues sin tiempo de inactividad notable.
- **Escalabilidad:** Debe soportar múltiples sucursales (multi-location) compartiendo una base de datos centralizada de manera eficiente.
- **Privacidad:** Cumplimiento estricto de normativas como RGPD y LOPD (2026). Acceso a historiales condicionado a roles.
- **Auditabilidad:** Trazabilidad completa de acciones. El sistema debe registrar qué usuario accedió, modificó o eliminó un dato clínico, financiero o personal, con sello de tiempo.

# 04. Reglas de Negocio

## Reglas Operativas
1. **Sistema de Triage (Tiempos de Espera):**
   - Nivel 1 (Reanimación): Atención Inmediata.
   - Nivel 2 (Emergencia): 15 a 30 min de espera máxima.
   - Nivel 3 (Urgencia): 30 a 60 min de espera.
   - Nivel 4 (Prioritario): Hasta 90 min de espera.
   - Nivel 5 (No Urgente): Según reserva de hora.
2. Las emergencias siempre tienen prioridad sobre las citas agendadas, lo que puede desplazar la programación del día.

## Restricciones
1. **Vacunación Antirrábica:** Las mascotas (perros y gatos) mayores de 16 semanas deben tener la vacuna contra la rabia al día antes de recibir servicios electivos.
2. **Pagos:** El pago debe realizarse al momento de recibir el servicio.

## Excepciones y Políticas de Inasistencia
1. **No-Shows (Inasistencias):**
   - Primera inasistencia: Se notifica al cliente y se le invita a reagendar.
   - Inasistencias recurrentes (Segunda en adelante): Se exige el pago de un depósito no reembolsable por el costo total de la consulta al momento de agendar.
2. **Nuevos Clientes:** Se requiere el pago de un depósito al momento de hacer la cita. Si cancelan con menos de 1 día hábil de anticipación, pierden el depósito.

## Validaciones Importantes
- Un cliente no puede considerarse "Activo" o usar agendamiento automático si su mascota tiene la vacuna antirrábica vencida (para servicios no urgentes).
- Toda receta o recarga de medicamentos requiere validación del veterinario y se pide un preaviso de 24 horas por parte del cliente.

# 05. Casos de Uso

## Caso de Uso 1: Agendar una Cita (Cliente Nuevo)
- **Actor:** Dueño de Mascota
- **Objetivo:** Reservar una hora para una consulta general.
- **Flujo Principal:**
  1. El actor ingresa al portal web y selecciona "Nueva Cita".
  2. Completa los datos personales e información básica de la mascota.
  3. Selecciona el servicio deseado, la fecha y la hora disponible.
  4. El sistema solicita el pago de un depósito (política de nuevo cliente).
  5. El actor realiza el pago.
  6. El sistema confirma la cita y envía un SMS de confirmación.
- **Excepciones:** El pago es rechazado (se cancela el flujo y no se reserva la hora).
- **Precondiciones:** El actor tiene conexión a internet y medio de pago válido.
- **Postcondiciones:** La cita aparece en el calendario de la clínica.

## Caso de Uso 2: Triage en Recepción
- **Actor:** Personal de Recepción
- **Objetivo:** Registrar y priorizar a un paciente que llega sin cita con síntomas graves.
- **Flujo Principal:**
  1. El actor busca al paciente en el sistema (o lo crea rápidamente).
  2. Selecciona la opción "Registrar Ingreso / Triage".
  3. Asigna el Nivel 2 (Emergencia) basado en los síntomas descritos (ej. dificultad para orinar).
  4. El sistema coloca al paciente al tope de la lista de espera (notificando al veterinario de turno).
- **Excepciones:** El paciente no tiene historial ni vacuna antirrábica (se registra como emergencia médica prioritaria y se atiende de todas formas).
- **Precondiciones:** El sistema está operativo.
- **Postcondiciones:** La cola de atención se reorganiza visualmente para reflejar la prioridad de emergencia.

# 06. Alcance MVP (Mínimo Producto Viable)

## Funcionalidades Obligatorias
1. **Gestión de Calendario y Citas:** Interfaz para que la clínica agende citas y visualice su día.
2. **Base de Datos Centralizada (CRM básico):** Fichas de dueños y pacientes.
3. **Historia Clínica Básica (EHR):** Entradas de texto enriquecido para exámenes físicos, notas y prescripciones.
4. **Recordatorios Automatizados:** Integración de SMS/Email unidireccional.
5. **Cumplimiento de Privacidad:** Gestión de consentimientos (RGPD/LOPD).
6. **Módulo de Triage:** Clasificador visual de estado de atención en la sala de espera.

## Funcionalidades Deseables pero No Esenciales (Fase 2)
1. Agendamiento online autoservicio por parte del cliente.
2. Portal o App móvil para el cliente.
3. Integraciones de Telemedicina (videollamadas embebidas).
4. Scribe basado en Inteligencia Artificial para redactar notas de consulta.
5. Pagos integrados avanzados (financiamiento tipo CareCredit).

## Justificación de Prioridad
El enfoque inicial debe solucionar el caos operativo interno (conflictos de programación, historias clínicas inaccesibles y tiempo perdido en tareas manuales). Una vez el núcleo operativo funcione y esté asegurado bajo la ley de protección de datos, se puede expandir hacia la automatización externa orientada al cliente.

# 08. Insumos para Etapa 2 (Diseño)

Este documento resume los componentes que ya cuentan con información suficiente para iniciar el proceso de diseño técnico y de producto por parte de otra IA.

- **Modelo de Datos:** - Entidades principales identificadas: Clínicas (Sucursales), Usuarios (Roles), Clientes (Dueños), Pacientes (Mascotas), Citas, Triage (Niveles 1-5), Historiales Clínicos (SOAP), Consentimientos Legales, Facturas/Depósitos.
  
- **Arquitectura:**
  - Sistema Web Cloud-based.
  - Almacenamiento seguro en la nube con cifrado y trazabilidad (para cumplir con RGPD/LOPD).
  - Integración mediante APIs (pasarelas de pago, servicios de SMS/Email).

- **Módulos del Sistema (MVP):**
  - Módulo de Calendario y Citas.
  - Módulo CRM y Registros Médicos (EHR).
  - Módulo de Sala de Espera / Triage.
  - Módulo de Administración (Configuraciones, Privacidad y Reportes básicos).

- **Prototipos Necesarios (Mockups a diseñar):**
  - Vista de agenda/calendario para recepción.
  - Vista de historia clínica adaptada a Tablets.
  - Flujo de creación rápida de emergencia (Triage).
  - Portal web de cliente para registrar datos y firmar consentimientos.

- **Backlog Técnico Inicial:**
  - Configuración de base de datos y esquemas de cifrado.
  - Desarrollo de sistema de autenticación y control de roles (RBAC).
  - Desarrollo de CRUD de pacientes/clientes.
  - Implementación de motor de reglas de negocio para reagendamientos e inasistencias.