# 🎯 Propósito
Este documento define los requerimientos y lógica de negocio para un sistema de gestión de citas veterinaria profesional, realista y no excesivamente complejo. Está pensado para una clínica con 1 a 5 veterinarios que necesita digitalizar su operación diaria sin convertirse en un sistema hospitalario avanzado.

**Idea central:** La cita conecta al cliente, la mascota, el veterinario, el servicio, la atención clínica y el pago. Todo el sistema gira alrededor de ese eje.

---

## 👥 Actores del Sistema

| Actor | Descripción | Panel de acceso |
| :--- | :--- | :--- |
| **Cliente** | Dueño o responsable de la mascota | Portal Cliente |
| **Recepcionista** | Gestiona agenda, registra cobros y atiende presencial | Panel Operativo |
| **Veterinario** | Atiende mascotas y registra atención clínica | Panel Veterinario |
| **Administrador** | Configura el sistema y supervisa todo | Panel Administrador |

---

## 🔐 MÓDULO 1 — Autenticación y Acceso

### Descripción
Controla quién puede entrar al sistema, con qué identidad y a qué parte del sistema accede según su rol.

### Requerimientos funcionales
*   **RF-01 — Registro de cliente (auto-registro)**
    *   El cliente puede registrarse desde la web sin necesidad de que la clínica lo cree manualmente.
    *   **Datos requeridos:** nombre completo, correo electrónico, contraseña, teléfono.
    *   **Datos opcionales:** documento de identidad, dirección.
    *   El correo no puede repetirse en el sistema.
    *   Al completar el registro, el sistema crea automáticamente una cuenta de acceso con rol Cliente.
    *   Puede agregar su primera mascota inmediatamente después de registrarse.
*   **RF-02 — Login**
    *   Acceso por correo y contraseña.
    *   Al autenticarse, el sistema detecta el rol y redirige:
        *   Cliente → `/portal-cliente`
        *   Recepcionista → `/agenda`
        *   Veterinario → `/mi-agenda`
        *   Administrador → `/dashboard`
    *   Si el usuario intenta acceder a una ruta que no le corresponde, se le deniega y redirige.
*   **RF-03 — Recuperación de contraseña**
    *   El usuario ingresa su correo y recibe un enlace para restablecer contraseña.
    *   El enlace caduca en 30 minutos.
*   **RF-04 — Gestión de usuarios internos (solo Admin)**
    *   El administrador puede crear cuentas para recepcionistas y veterinarios.
    *   Puede activar o desactivar cuentas internas sin eliminarlas.
    *   No puede eliminar una cuenta si tiene historial de citas o atenciones.

### Reglas de negocio
> 1. Las contraseñas se almacenan siempre con hash seguro. Nunca en texto plano.
> 2. Un usuario desactivado no puede iniciar sesión.
> 3. El sistema no debe revelar si un correo existe o no en el mensaje de error del login (seguridad).

---

## 👤 MÓDULO 2 — Gestión de Clientes

### Descripción
Un cliente es el responsable administrativo y legal de una o más mascotas. Puede tener acceso digital al portal o existir solo como registro interno de la clínica.

### Requerimientos funcionales
*   **RF-05 — Registrar cliente desde recepción**
    *   La recepcionista o administrador puede crear un cliente manualmente.
    *   **Datos requeridos:** nombre completo, teléfono.
    *   **Datos opcionales:** documento de identidad, correo electrónico, dirección, observaciones.
    *   Si tiene correo, se puede habilitar acceso al portal posteriormente.
*   **RF-06 — Buscar cliente**
    *   Búsqueda en tiempo real por: nombre, teléfono, documento o correo.
    *   Los resultados muestran nombre, teléfono y número de mascotas registradas.
*   **RF-07 — Ver ficha del cliente**
    *   Muestra datos personales, lista de mascotas, historial de citas y resumen de pagos.
*   **RF-08 — Editar datos del cliente**
    *   Se pueden actualizar todos los datos de contacto.
    *   El historial no se ve afectado por cambios de datos.
*   **RF-09 — Inactivar cliente**
    *   Un cliente no se elimina nunca si tiene mascotas o historial.
    *   Se marca como inactivo. Sus datos y el historial de sus mascotas se conservan.
    *   Un cliente inactivo no puede agendar nuevas citas.

### Reglas de negocio
> 1. Toda mascota debe tener obligatoriamente un cliente responsable.
> 2. No puede existir un cliente duplicado con el mismo documento o correo.
> 3. Si el cliente no tiene correo registrado, no puede acceder al portal.

---

## 🐾 MÓDULO 3 — Gestión de Mascotas

### Descripción
La mascota es la unidad clínica central del sistema. Todo el historial médico, vacunas, diagnósticos y tratamientos están asociados a ella, no al cliente.

### Requerimientos funcionales
*   **RF-10 — Registrar mascota**
    *   **Datos requeridos:** nombre, especie (Perro / Gato / Ave / Otro), cliente responsable.
    *   **Datos opcionales:** raza, sexo, fecha de nacimiento o edad estimada, peso inicial, color, observaciones generales, alergias conocidas.
*   **RF-11 — Ficha completa de la mascota**
    *   La ficha muestra en una sola pantalla:
        *   Datos generales de la mascota.
        *   Nombre del cliente responsable con enlace a su ficha.
        *   Próximas citas agendadas.
        *   Historial de citas pasadas con fecha, servicio y veterinario.
        *   Resumen de atenciones clínicas.
        *   Alertas visibles: alergias, condición crónica, última vacuna.
*   **RF-12 — Editar datos de la mascota**
    *   Se pueden modificar datos generales sin afectar el historial clínico.
    *   El peso puede actualizarse en cada atención.
*   **RF-13 — Inactivar mascota**
    *   Si la mascota fallece, cambia de dueño o deja de asistir, se marca como inactiva.
    *   Nunca se elimina si tiene historial clínico.
    *   Las citas futuras de una mascota inactivada deben cancelarse automáticamente.

### Reglas de negocio
> 1. No se puede registrar una mascota sin asociarla a un cliente.
> 2. Una mascota inactiva no puede tener nuevas citas.
> 3. El historial clínico pertenece a la mascota y permanece aunque el cliente cambie.

---

## 🛠️ MÓDULO 4 — Catálogo de Servicios

### Descripción
El catálogo define qué servicios ofrece la clínica, cuánto cuestan y cuánto tiempo ocupan en agenda. Es la base para agendar citas y calcular cobros.

### Requerimientos funcionales
*   **RF-14 — Crear servicio**
    *   **Datos requeridos:** nombre, duración en minutos, precio base.
    *   **Datos opcionales:** descripción, si requiere veterinario asignado o puede ser solo técnico.
*   **RF-15 — Editar servicio**
    *   Se puede modificar nombre, descripción, duración y precio.
    *   Los cambios de precio no afectan citas ya registradas (precio se fija al crear la cita).
*   **RF-16 — Activar / desactivar servicio**
    *   Un servicio desactivado no aparece como opción al agendar.
    *   No se elimina si tiene citas históricas asociadas.
*   **RF-17 — Listado de servicios**
    *   Visible para recepción y administrador.
    *   El cliente solo ve los servicios activos al momento de agendar.

### Ejemplos de servicios típicos

| Servicio | Duración | Precio referencial |
| :--- | :--- | :--- |
| Consulta general | 30 min | Variable |
| Vacunación | 15 min | Variable |
| Desparasitación | 15 min | Variable |
| Control postoperatorio | 20 min | Variable |
| Limpieza dental | 60 min | Variable |
| Procedimiento menor | 45 min | Variable |
| Baño y corte | 90 min | Variable |

### Reglas de negocio
> 1. La duración del servicio se usa para calcular si el horario está disponible.
> 2. El precio base es referencial. El monto final puede ajustarse al cobrar.
> 3. No puede existir dos servicios activos con el mismo nombre.

---

## 📅 MÓDULO 5 — Agenda y Gestión de Citas

### Descripción
La agenda es el corazón operativo del sistema. Controla el tiempo de cada veterinario, evita solapamientos y permite que clientes y personal gestionen citas de forma ordenada.

### Requerimientos funcionales
*   **RF-18 — Ver agenda**
    *   Vista diaria y semanal de citas por veterinario.
    *   Muestra nombre del cliente, mascota, servicio, hora y estado.
    *   Permite filtrar por veterinario, fecha y estado.
*   **RF-19 — Crear cita (desde recepción o admin)**
    *   **Datos requeridos:** mascota, servicio, fecha, hora.
    *   **Datos opcionales:** veterinario preferido, motivo específico, canal de origen (presencial / teléfono / web).
    *   El sistema valida disponibilidad antes de confirmar.
    *   Si no se asigna veterinario, queda pendiente de asignación.
*   **RF-20 — Solicitar cita (desde portal del cliente)**
    *   El cliente selecciona: mascota, servicio, fecha y rango horario disponible.
    *   El sistema muestra solo horarios disponibles.
    *   La cita queda en estado Pendiente de confirmación hasta que recepción la confirme.
    *   El cliente recibe notificación cuando se confirma o rechaza.
*   **RF-21 — Validación de disponibilidad**
    *   El sistema debe verificar antes de crear cualquier cita:
        *   Que el veterinario no tenga otra cita en ese bloque de tiempo.
        *   Que la fecha y hora estén dentro del horario de atención de la clínica.
        *   Que la mascota no tenga ya una cita en ese mismo horario.
        *   Que el servicio esté activo.
*   **RF-22 — Confirmar cita**
    *   La recepcionista confirma citas solicitadas por portal.
    *   Al confirmar, el estado pasa de Pendiente de confirmación a Confirmada.
    *   Se notifica al cliente.
*   **RF-23 — Reprogramar cita**
    *   Se puede cambiar fecha, hora y veterinario.
    *   Se registra quién reprogramó, cuándo y el motivo.
    *   El cliente recibe notificación.
*   **RF-24 — Cancelar cita**
    *   Puede cancelar: el cliente (desde el portal), la recepcionista o el administrador.
    *   Se registra motivo:
        *   Canceló el cliente
        *   Reprogramación solicitada por cliente
        *   Reprogramación por la clínica
        *   Veterinario no disponible
        *   Error de agenda
    *   El cliente recibe notificación.
*   **RF-25 — Marcar no asistencia**
    *   Si el cliente no llega en el tiempo definido (ej. 15 min después de la hora), la cita puede marcarse como No asistió.

### Ciclo de vida de una cita

```text
[CLIENTE solicita]     [RECEPCIÓN gestiona]     [VETERINARIO atiende]
       │                       │                         │
  Solicitada ──────► Pendiente ──────► Confirmada ──────► En espera
                    de confirmación                          │
                                                        En atención
                                                             │
                                                         Completada
                    Cancelada ◄──────────────────────────────┤
                    No asistió ◄─────────────────────────────┘
```

### Reglas de negocio
> 1. Un veterinario no puede tener dos citas activas en el mismo bloque horario.
> 2. No se puede agendar una cita en fecha pasada.
> 3. Una cita cancelada o completada no puede reactivarse; se debe crear una nueva.
> 4. El cliente solo puede cancelar sus propias citas con al menos 2 horas de anticipación.
> 5. Una cita en estado En atención ya no puede cancelarse desde el portal del cliente.

---

## 🏥 MÓDULO 6 — Atención Clínica

### Descripción
Registra lo que ocurre durante la consulta. La atención clínica siempre debe estar vinculada a una cita, y pertenece a la mascota como parte de su historial permanente.

### Requerimientos funcionales
*   **RF-26 — Iniciar atención**
    *   El veterinario selecciona una cita en estado Confirmada o En espera.
    *   Al iniciar, la cita pasa automáticamente a En atención.
    *   Se muestra la ficha de la mascota con antecedentes relevantes.
*   **RF-27 — Registrar signos básicos (opcional)**
    *   Peso actual.
    *   Temperatura.
    *   Frecuencia cardíaca.
    *   Observaciones de ingreso.
*   **RF-28 — Registrar historia clínica simplificada**

| Campo | Descripción |
| :--- | :--- |
| **Motivo de consulta** | Lo que reporta el dueño |
| **Hallazgos** | Resultado del examen físico |
| **Diagnóstico** | Presuntivo o definitivo |
| **Tratamiento** | Procedimiento realizado en consulta |
| **Medicación** | Medicamentos indicados con dosis |
| **Recomendaciones** | Cuidados en casa, dieta, reposo |
| **Próximo control** | Fecha sugerida para revisión |

*   **RF-29 — Cerrar atención**
    *   Al guardar y cerrar, la cita pasa a Completada.
    *   Desde ese momento queda habilitado el registro del pago.
    *   La historia clínica queda en solo lectura para el veterinario. Solo el administrador puede editarla posteriormente.
*   **RF-30 — Ver historial clínico de la mascota**
    *   El veterinario puede ver todas las atenciones previas de la mascota antes de consultar.
    *   El cliente puede ver su historial desde el portal en modo solo lectura.

### Reglas de negocio
> 1. No puede existir una atención clínica sin mascota identificada.
> 2. No puede existir una atención sin una cita asociada, salvo urgencias. En ese caso, el sistema debe crear una cita de tipo "Urgencia" automáticamente.
> 3. Solo el veterinario asignado puede registrar o editar la atención mientras está abierta.
> 4. Una vez cerrada, la historia clínica solo puede modificarse con permiso de administrador.

---

## 💰 MÓDULO 7 — Pagos y Cobros

### Descripción
El pago cierra el ciclo administrativo de la atención. Siempre debe estar vinculado a una cita o atención concreta para mantener trazabilidad.

### Requerimientos funcionales
*   **RF-31 — Registrar cobro**
    *   Disponible solo cuando la cita está en estado Completada.
    *   El sistema sugiere el precio base del servicio como monto.
    *   El operador puede ajustar el monto final.
    *   **Datos requeridos:** monto, método de pago.
    *   **Datos opcionales:** número de operación, observación.
*   **RF-32 — Métodos de pago soportados**
    *   Efectivo
    *   Tarjeta (solo registrar el dato, no almacenar número de tarjeta)
    *   Transferencia bancaria
    *   Yape / Plin u otro medio digital local
*   **RF-33 — Estados de pago**

| Estado | Descripción |
| :--- | :--- |
| **Pendiente** | La cita está completada pero aún no se registró el cobro |
| **Pagado** | El cobro fue registrado en su totalidad |
| **Pago parcial** | Se cobró un adelanto; queda saldo pendiente |
| **Anulado** | El pago fue revertido con autorización del administrador |

*   **RF-34 — Pago parcial**
    *   Se registra el monto pagado.
    *   El sistema calcula y muestra el saldo pendiente.
    *   Se puede completar el pago en otro momento.
*   **RF-35 — Anular pago**
    *   Solo el administrador puede anular un pago registrado.
    *   Se debe registrar el motivo de la anulación.
*   **RF-36 — Comprobante interno PDF**
    *   El comprobante debe incluir: Número de operación interno, Nombre del cliente, Nombre y especie de la mascota, Servicio prestado, Veterinario que atendió, Fecha y hora, Monto cobrado, Método de pago, Nombre del operador que registró el cobro.
*   **RF-37 — Historial de pagos**
    *   El administrador puede ver todos los pagos por rango de fecha.
    *   El cliente puede ver sus propios pagos desde el portal.

### Reglas de negocio
> 1. Un pago siempre debe estar vinculado a una cita concreta.
> 2. No se registran pagos por montos negativos o cero.
> 3. No se deben almacenar números completos de tarjeta en la base de datos.
> 4. El precio final puede ser diferente al precio base del servicio, pero debe justificarse.

---

## 🔔 MÓDULO 8 — Notificaciones

### Descripción
El sistema debe informar al cliente y al personal sobre eventos relevantes de forma simple y oportuna.

### Requerimientos funcionales
*   **RF-38 — Notificaciones para el cliente**

| Evento | Canal sugerido |
| :--- | :--- |
| Cita confirmada | Correo + notificación interna |
| Cita reprogramada | Correo + notificación interna |
| Cita cancelada | Correo + notificación interna |
| Recordatorio 24h antes | Correo |
| Control próximo sugerido | Correo |

*   **RF-39 — Notificaciones internas (para el personal)**
    *   Nueva cita solicitada desde el portal del cliente.
    *   Cita próxima a vencer sin confirmación.
    *   Cita con pago pendiente de más de X días.

### Reglas de negocio
> 1. En la primera versión, las notificaciones son por correo o internas en el sistema.
> 2. WhatsApp y SMS pueden integrarse en una fase posterior.
> 3. El cliente puede desactivar notificaciones de recordatorio desde su perfil.

---

## 🌐 MÓDULO 9 — Portal del Cliente

### Descripción
Interfaz exclusiva para clientes. Diseño simple y orientado a las acciones que un dueño de mascota realmente necesita hacer sin tener que llamar a la clínica.

### Requerimientos funcionales
*   **RF-40 — Panel principal del cliente**
    *   Muestra al ingresar: Próximas citas (máximo 3 visibles), Mascotas registradas y Alertas activas (ej. vacuna próxima a vencer, pago pendiente).
*   **RF-41 — Mis mascotas**
    *   Lista de mascotas activas con foto, nombre, especie y edad.
    *   Acceso a la ficha básica de cada mascota.
    *   Botón para registrar nueva mascota.
*   **RF-42 — Registrar mascota**
    *   El cliente puede registrar una mascota directamente desde el portal.
    *   **Datos mínimos:** nombre, especie.
    *   La clínica puede completar datos en la primera visita.
*   **RF-43 — Nueva cita**
    *   Flujo para el cliente: Selecciona mascota → Selecciona servicio del catálogo activo → Selecciona fecha en un calendario que muestra días disponibles → Selecciona hora de los bloques disponibles para esa fecha → Escribe motivo opcional → Confirma la solicitud.
    *   La cita queda en Pendiente de confirmación.
*   **RF-44 — Mis citas**
    *   Lista de citas próximas con estado, fecha, hora, mascota y servicio.
    *   Historial de citas pasadas.
    *   Opción de cancelar citas con estado Pendiente de confirmación o Confirmada, solo con al menos 2 horas de anticipación.
*   **RF-45 — Historial clínico**
    *   El cliente puede ver el historial de atenciones de sus mascotas.
    *   Solo lectura. No puede editar ningún dato clínico.
    *   Muestra: fecha, veterinario, diagnóstico y recomendaciones de cada atención.
*   **RF-46 — Mis pagos**
    *   Lista de pagos realizados con fecha, monto, servicio y método.
    *   Opción de ver o descargar el comprobante PDF.
*   **RF-47 — Mi perfil**
    *   El cliente puede actualizar su teléfono, dirección y contraseña.
    *   No puede cambiar su correo sin verificación.

---

## 📊 MÓDULO 10 — Reportes y Dashboard

### Descripción
Herramientas de consulta para que el administrador y la recepcionista puedan tomar decisiones operativas basadas en datos reales.

### Requerimientos funcionales
*   **RF-48 — Panel diario (Recepción y Admin)**
    *   Visible al iniciar sesión. Muestra en tiempo real: Total de citas del día, Citas pendientes de confirmación, Citas confirmadas para hoy, Citas completadas hoy, Cancelaciones del día, No asistencias del día, Total cobrado hoy, Cobros pendientes del día.
*   **RF-49 — Reporte de citas**
    *   Filtros: por rango de fecha, veterinario, estado, servicio.
    *   Columnas: fecha, cliente, mascota, servicio, veterinario, estado.
    *   Exportable a PDF o Excel.
*   **RF-50 — Reporte de pagos**
    *   Filtros: por rango de fecha, método de pago, estado.
    *   Muestra total cobrado, desglose por método y pagos pendientes.
    *   Exportable.
*   **RF-51 — Estadísticas operativas**
    *   Servicios más solicitados por período.
    *   Veterinarios con más atenciones.
    *   Clientes más frecuentes.
    *   Tasa de no show (porcentaje de citas que terminaron en "No asistió").
    *   Días y horas pico de la semana.

### Reglas de negocio
> 1. Solo el administrador puede ver reportes financieros completos.
> 2. La recepcionista puede ver el panel diario pero no los reportes de ingresos detallados.
> 3. Los reportes no deben mostrar información clínica, solo operativa y administrativa.

---

## 🔒 Requerimientos No Funcionales

| ID | Requerimiento | Prioridad |
| :--- | :--- | :--- |
| **RNF-01** | Las contraseñas se almacenan con hash seguro, nunca en texto plano | Alta |
| **RNF-02** | Toda ruta que modifica datos requiere autenticación y autorización por rol | Alta |
| **RNF-03** | El cliente nunca puede acceder a datos de otro cliente | Alta |
| **RNF-04** | No almacenar números completos de tarjetas en la base de datos | Alta |
| **RNF-05** | Toda eliminación es lógica con campo Activo, nunca física si hay historial | Alta |
| **RNF-06** | La agenda diaria debe cargar en menos de 2 segundos | Media |
| **RNF-07** | El sistema debe ser usable en escritorio y tablet | Media |
| **RNF-08** | Los errores devuelven mensajes amigables, sin stack traces expuestos | Media |
| **RNF-09** | Toda acción sensible guarda auditoría: quién, cuándo y qué cambió | Media |

---

## 🗂️ Resumen de entidades del sistema

| Entidad | Propósito |
| :--- | :--- |
| **Usuario** | Cuenta de acceso con rol |
| **Cliente** | Perfil del dueño de mascota |
| **Mascota** | Unidad clínica central |
| **Veterinario** | Profesional que atiende |
| **Servicio** | Catálogo de lo que ofrece la clínica |
| **Cita** | Eje operativo que conecta todo |
| **AtenciónClínica** | Registro médico de la consulta |
| **Pago** | Registro del cobro por atención |
| **Notificación** | Avisos al cliente y personal |
