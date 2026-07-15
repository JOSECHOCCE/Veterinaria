# Especificación Funcional de Pantallas

**Código del Documento:** `5-stitch-screen-spec.md`  
**Estado:** Definición Funcional  
**Audiencia:** Desarrolladores Frontend, Diseñadores UI/UX, QA  

---

## 📋 Propósito
Este archivo define la especificación funcional de pantallas para el frontend del sistema veterinario. No define el estilo visual final; el estilo visual lo determina `DESIGN.md` cargado en Stitch. Este archivo determina qué pantallas existen, qué datos muestran, qué acciones permiten, qué roles las usan y qué estados visuales deben contemplarse.

---

## 🌐 Reglas Globales

> 💡 **Principio de Diseño:** Priorizar la claridad operativa y la eficiencia profesional sobre la ornamentación.

1. **Enfoque de Plataforma:** Todas las pantallas deben diseñarse primero como **WEB DESKTOP**. No generar vistas mobile-first.
2. **Ciclo de Vida Visual:** Cada pantalla debe contemplar obligatoriamente los siguientes estados:
   * ⏳ Cargando (con skeleton o placeholder sobrio).
   * 📭 Vacío útil (con mensaje claro y acción sugerida).
   * ❌ Error amigable (sin detalles técnicos expuestos, opción de reintentar).
   * ✅ Éxito (tras acciones importantes).
   * 🔐 Permiso denegado (cuando el rol no esté autorizado).
3. **Integración con Backend:** Toda acción que modifique datos debe asumir integración mediante servicios y Axios centralizado. Prohibido el uso de `fetch` embebido en la vista.
4. **Flujos de Estado:** Toda pantalla debe respetar estrictamente los flujos UML y el ciclo de vida oficial. No inventar transiciones de estado nuevas.
5. **Identidad Visual:** La UI debe sentirse profesional y clara, adaptándose fielmente a la identidad editorial descrita en `DESIGN.md`.
6. **Tablas y Listas Operativas:** Deben incluir de manera obligatoria filtros visibles, buscador en tiempo real (si aplica) y acciones contextuales accesibles por cada fila.
7. **Control de Acceso:** La navegación y la visibilidad de elementos y acciones dependen estrictamente del rol autenticado del usuario.

---

## 🧱 Módulos del Sistema

### 🔐 Módulo 1 — Autenticación y Acceso

#### Pantalla: Login
* **Roles:** Todos los usuarios no autenticados.
* **Propósito:** Permitir el inicio de sesión por correo y contraseña.
* **Datos Visibles:**
  * Campo de texto: Correo electrónico.
  * Campo de texto: Contraseña.
  * Mensaje de error genérico.
  * Enlace directo a registro de cliente.
* **Acciones:**
  * Iniciar sesión.
  * Redirigir a pantalla de registro.
* **Estados:** Idle, Cargando (al enviar credenciales), Error genérico de acceso.
* **Reglas de Negocio:**
  * Por seguridad, no revelar si el correo ingresado existe o no en el sistema.
  * Redirección automática según el rol tras un inicio de sesión exitoso:
    * **Cliente** ➔ `portal-cliente`
    * **Recepcionista** ➔ `agenda`
    * **Veterinario** ➔ `mi-agenda`
    * **Administrador** ➔ `dashboard`

#### Pantalla: Registro de Cliente
* **Roles:** Visitante no autenticado.
* **Propósito:** Crear una cuenta de cliente de forma autónoma desde la web.
* **Datos Visibles:**
  * Nombre completo, Correo electrónico, Contraseña, Teléfono.
  * Documento de identidad (Opcional).
  * Dirección de domicilio (Opcional).
* **Acciones:**
  * Registrarse (Enviar formulario).
  * Cancelar y volver al Login.
* **Estados:** Validación local en tiempo real, Cargando, Error por duplicidad, Éxito de registro.
* **Reglas de Negocio:**
  * El correo electrónico es un identificador único y no puede repetirse.
  * Tras un registro exitoso, se habilita automáticamente el flujo de registro de la primera mascota.

#### Pantalla: Gestión de Usuarios Internos
* **Roles:** Administrador.
* **Propósito:** Proveer el mantenimiento completo (alta, baja y consulta) de cuentas del personal interno.
* **Datos Visibles:**
  * Tabla de usuarios internos con columnas: Nombre, Correo, Rol, Estado (Activo/Inactivo).
* **Acciones:**
  * Crear usuario interno.
  * Editar datos básicos.
  * Activar cuenta / Desactivar cuenta.
  * Intentar eliminar cuenta (restringido por historial).
* **Estados:** Lista vacía, Confirmación de cambio de estado (activación/desactivación), Bloqueo por historial existente.
* **Reglas de Negocio:**
  * Acceso exclusivo para el rol de Administrador.
  * No se permite la eliminación física de cuentas que posean historial de citas, atenciones o transacciones en el sistema.

---

### 👥 Módulo 2 — Gestión de Clientes

#### Pantalla: Listado de Clientes
* **Roles:** Recepcionista, Administrador.
* **Propósito:** Búsqueda, filtrado y administración centralizada de los clientes de la clínica.
* **Datos Visibles:**
  * Buscador principal.
  * Tabla operativa: Nombre completo, Teléfono, Correo, Documento, Número de mascotas asociadas, Estado de la cuenta.
* **Acciones:**
  * Buscar en tiempo real (por nombre, teléfono, documento o correo).
  * Ver ficha completa del cliente.
  * Crear nuevo cliente.
  * Editar datos.
  * Inactivar cliente.
* **Estados:** Sin resultados, Cargando búsqueda, Error de red.

#### Pantalla: Registrar Cliente
* **Roles:** Recepcionista, Administrador.
* **Propósito:** Dar de alta de forma manual a un cliente desde el mostrador de recepción.
* **Datos Visibles:**
  * Campos obligatorios: Nombre completo, Teléfono.
  * Campos opcionales: Documento, Correo electrónico, Dirección, Observaciones generales.
* **Acciones:**
  * Guardar cliente.
  * Guardar y abrir ficha del cliente inmediatamente.
* **Estados:** Advertencia por posible duplicado, Validación de campos obligatorios, Éxito de guardado.
* **Reglas de Negocio:**
  * Si el sistema detecta coincidencia exacta en documento, correo o teléfono, se debe desplegar una advertencia visual bloqueante. No realizar fusión automática de datos.

#### Pantalla: Ficha del Cliente
* **Roles:** Recepcionista, Administrador.
* **Propósito:** Vista consolidada de 360 grados del perfil del cliente.
* **Datos Visibles:**
  * Datos personales y de contacto.
  * Bloque: Lista de mascotas registradas.
  * Bloque: Historial cronológico de citas.
  * Bloque: Resumen consolidado de pagos y deudas.
  * Indicador de Estado (Activo/Inactivo).
* **Acciones:**
  * Editar datos personales.
  * Inactivar cuenta de cliente.
  * Navegar a la ficha de una mascota específica.
  * Registrar nueva mascota asociada.
  * Crear nueva cita para el cliente.
* **Estados:** Cliente sin mascotas, Cliente sin historial previo, Cliente inactivo.
* **Reglas de Negocio:**
  * Un cliente con estado "Inactivo" tiene restringida la creación o agendamiento de nuevas citas.

#### Pantalla: Editar Cliente
* **Roles:** Recepcionista, Administrador.
* **Propósito:** Actualizar la información de contacto y datos generales del cliente.
* **Acciones:**
  * Guardar cambios.
* **Reglas de Negocio:**
  * Los cambios realizados no alteran ni modifican la información histórica de citas o documentos de cobro previos.
  * Validar duplicidad de datos críticos antes de persistir los cambios.

---

### 🐾 Módulo 3 — Gestión de Mascotas

#### Pantalla: Listado o Selector de Mascotas
* **Roles:** Recepcionista, Administrador, Veterinario, Cliente (restringido a sus mascotas desde su portal).
* **Propósito:** Localizar y seleccionar mascotas de manera contextual (ej. al agendar o iniciar consulta).
* **Datos Visibles:**
  * Nombre de la mascota, Especie, Cliente responsable (Dueño), Estado operativo.
* **Acciones:**
  * Ver ficha clínica de la mascota.
  * Registrar nueva mascota.
* **Estados:** Sin mascotas registradas, Mascota inactiva (debe destacarse con un tratamiento visual de atenuación).

#### Pantalla: Registrar Mascota
* **Roles:** Recepcionista, Administrador, Cliente (desde su portal si la política del negocio lo habilita).
* **Propósito:** Registrar un nuevo espécimen vinculándolo obligatoriamente a un cliente responsable.
* **Datos Visibles:**
  * Formulario: Nombre, Especie, Cliente responsable (buscador/selector), Raza, Sexo, Fecha de nacimiento (o edad estimada), Peso inicial, Color, Observaciones generales, Alergias conocidas.
* **Acciones:**
  * Guardar registro de mascota.
* **Reglas de Negocio:**
  * Restricción estricta: No se puede dar de alta una mascota en el sistema sin un cliente responsable asignado.

#### Pantalla: Ficha Completa de Mascota
* **Roles:** Recepcionista, Administrador, Veterinario, Cliente (modo consulta restringido).
* **Propósito:** Unidad de visualización clínica central de la mascota.
* **Datos Visibles:**
  * Datos generales de identificación.
  * Enlace directo al perfil del Cliente Responsable.
  * Bloque: Próximas citas agendadas.
  * Bloque: Historial completo de citas.
  * Bloque: Resumen clínico ejecutivo.
  * **Sección de Alertas Críticas (Alta Visibilidad):** Alergias, condiciones crónicas, última vacuna aplicada.
* **Acciones:**
  * Editar datos de la mascota.
  * Cambiar de cliente responsable.
  * Inactivar mascota.
  * Agendar cita médica.
  * Acceder a la Historia Clínica Completa.
* **Estados:** Sin próximas citas, Sin historial clínico registrado, Mascota inactiva.
* **Reglas de Negocio:**
  * El historial clínico está ligado intrínsecamente a la identidad de la mascota y permanece inalterable aunque se realice un cambio de propietario o cliente responsable.

#### Pantalla: Cambio de Responsable
* **Roles:** Recepcionista, Administrador.
* **Propósito:** Traspasar de forma legal y segura la titularidad de la mascota a otro cliente.
* **Datos Visibles:**
  * Cliente responsable actual.
  * Buscador y selector del nuevo cliente.
  * Campo de texto: Motivo del cambio o nota interna.
* **Acciones:**
  * Confirmar cambio de titularidad.
* **Reglas de Negocio:**
  * La mascota debe conservar su historial clínico íntegro.
  * El sistema debe auditar de manera obligatoria la fecha, hora y el usuario interno que realizó la reasignación.

---

### 🛠️ Módulo 4 — Catálogo de Servicios

#### Pantalla: Listado de Servicios
* **Roles:** Recepcionista, Administrador. *(El Cliente solo consume los servicios activos contextualizados en su proceso de reserva)*.
* **Propósito:** Administrar la oferta comercial y operativa de la clínica veterinaria.
* **Datos Visibles:**
  * Nombre del servicio, Duración estimada, Precio base, Indicador si requiere personal médico veterinario, Especialidad requerida, Estado (Activo/Inactivo).
* **Acciones:**
  * Crear nuevo servicio.
  * Editar servicio existente.
  * Alternar estado (Activar/Desactivar).
* **Estados:** Sin servicios configurados, Servicio inactivo resaltado.
* **Reglas de Negocio:**
  * Un servicio marcado como "Inactivo" se oculta automáticamente de las opciones disponibles en cualquier flujo de agendamiento.

#### Pantalla: Crear/Editar Servicio
* **Roles:** Administrador, Recepcionista (sujeto a políticas internas).
* **Datos Visibles:**
  * Formulario: Nombre, Duración (en minutos), Precio base, Descripción detallada, Checkbox "Requiere Veterinario", Selector de Especialidad Requerida.
* **Acciones:**
  * Guardar cambios.
* **Reglas de Negocio:**
  * No se permite la creación de un servicio duplicado activo con el mismo nombre.
  * Las modificaciones en el precio base no afectarán de manera retroactiva a las citas que ya se encuentren registradas o completadas.

---

### 📅 Módulo 5 — Agenda y Gestión de Citas

#### Pantalla: Agenda Operativa Diaria/Semanal
* **Roles:** Recepcionista, Administrador, Veterinario.
* **Propósito:** Panel de control principal de la operación diaria de la clínica.
* **Datos Visibles:**
  * Vista de bloques de agenda distribuidos por hora.
  * Datos por bloque: Cliente, Mascota, Servicio a realizar, Veterinario asignado, Estado actual de la cita.
  * Panel de filtros: Por fecha (día/semana), por médico veterinario y por estado de cita.
* **Acciones Contextuales:**
  * Ver detalle extendido de la cita.
  * Crear nueva cita operativa.
  * Confirmar / Rechazar solicitud entrante.
  * Reprogramar / Cancelar cita.
  * Registrar hitos de asistencia: Marcar llegada, Marcar no asistencia, Iniciar atención médica.
* **Estados:** Sin citas agendadas, Filtros sin coincidencias, Indicadores visuales cromáticos diferenciados por estado de la cita.
* **Reglas de Negocio:**
  * La interfaz debe validar dinámicamente y respetar el ciclo de vida del estado de la cita. No permitir acciones que rompan las transiciones lógicas.

#### Pantalla: Solicitudes Pendientes de Confirmación
* **Roles:** Recepcionista, Administrador.
* **Propósito:** Bandeja de entrada para auditar y confirmar las citas creadas de forma autónoma por los clientes.
* **Datos Visibles:**
  * Listado de solicitudes con: Mascota, Cliente, Servicio solicitado, Fecha y hora sugerida, Veterinario preferido, Motivo expuesto.
* **Acciones:**
  * Confirmar solicitud.
  * Rechazar con motivo obligatorio.
  * Reprogramar (invocando validación automática de disponibilidad).
* **Estados:** Sin solicitudes pendientes en cola.
* **Reglas de Negocio:**
  * Confirmar cambia el estado de la cita a **Confirmada**.
  * Rechazar libera inmediatamente el bloque horario asignado.
  * Reprogramar valida contra la agenda en tiempo real y dispara una notificación al cliente.

#### Pantalla: Crear Cita Operativa
* **Roles:** Recepcionista, Administrador.
* **Propósito:** Agendamiento manual directo desde el mostrador o por llamada telefónica.
* **Datos Visibles:**
  * Selector de mascota (búsqueda predictiva), Selector de servicio, Fecha, Bloque horario, Veterinario asignado, Motivo de consulta, Canal de origen (Ej. Presencial, Telefónico).
* **Acciones:**
  * Guardar como **Confirmada**.
  * Guardar como **Pendiente de asignación**.
* **Reglas de Negocio:**
  * Validación multidimensional obligatoria en frontend antes de guardar: verificar horario laboral activo, estatus activo de servicio, mascota y cliente, y validar la compatibilidad y especialidad del veterinario seleccionado.

#### Pantalla: Detalle de Cita
* **Roles:** Recepcionista, Administrador, Veterinario. *(Cliente posee una vista de lectura limitada)*.
* **Propósito:** Auditoría y operación detallada sobre una cita específica.
* **Datos Visibles:**
  * Ficha consolidada: Cliente, Mascota, Servicio, Veterinario, Bloque temporal exacto, Estado de la cita.
  * Bitácora/Historial de cambios de estado relevantes.
  * Sección de motivos (Desplegado en caso de Cancelación/Rechazo/Reprogramación).
* **Acciones:**
  * Cambiar estado (permitidos según matriz).
  * Reprogramar / Cancelar.
  * Registrar llegada en recepción.
  * Iniciar atención médica.
* **Reglas de Negocio:**
  * El flujo de botones de acción de cambio de estado se rige estrictamente por las transiciones definidas en el `stateDiagram` oficial del sistema.

#### Pantalla: Configuración de Horarios y Bloqueos
* **Roles:** Administrador, Recepcionista (restringido únicamente a bloqueos manuales temporales).
* **Propósito:** Configurar la disponibilidad operativa base de la clínica.
* **Estructura Interna (Subpantallas):**
  1. Horario general de la clínica.
  2. Horarios específicos por médico veterinario.
  3. Gestión de bloqueos manuales (días festivos, ausencias médicas, emergencias).
* **Datos Visibles:**
  * Matriz de días laborables, Horas de apertura y cierre, Configuración de descansos intermedios, Catálogo de motivos de bloqueo.
* **Acciones:**
  * Guardar plantilla horaria.
  * Crear, editar o remover bloqueos temporales.
* **Reglas de Negocio:**
  * Cualquier modificación o inserción de bloqueo condiciona en tiempo real la disponibilidad mostrada en las pantallas de agendamiento operativo y del portal del cliente.

#### Pantalla: Nueva Cita desde Portal del Cliente
* **Roles:** Cliente (Autenticado).
* **Propósito:** Permitir al usuario auto-agendar una cita para sus mascotas.
* **Flujo Secuencial Visual (Wizard):**
  * **Paso 1:** Seleccionar mascota del propietario.
  * **Paso 2:** Seleccionar servicio requerido.
  * **Paso 3:** Elegir fecha en calendario interactivo.
  * **Paso 4:** Elegir bloque de hora disponible.
  * **Paso 5:** Digitar motivo de la consulta (Opcional).
  * **Paso 6:** Confirmación y envío de solicitud.
* **Datos Visibles:**
  * Calendario de disponibilidad en tiempo real, Bloques horarios libres.
  * **Temporizador visible de reserva temporal (5 minutos de bloqueo del slot).**
* **Acciones:**
  * Seleccionar bloque horario.
  * Confirmar y reservar.
  * Reiniciar flujo (si expira el temporizador).
* **Estados:** Sin disponibilidad para la fecha, Reserva temporal activa, Tiempo expirado, Solicitud enviada exitosamente.
* **Reglas de Negocio:**
  * Restricción de UI: El cliente bajo ninguna circunstancia escribe la hora de forma manual; debe seleccionarla de los bloques validados.
  * La cita se guarda por defecto con estado **Pendiente de confirmación**.

---

### 🩺 Módulo 6 — Atención Clínica

#### Pantalla: Mi Agenda del Veterinario
* **Roles:** Veterinario.
* **Propósito:** Cola de atención diaria estructurada para el profesional médico.
* **Datos Visibles:**
  * Listado segmentado: Citas confirmadas del día, Citas con estatus "En Espera" (Mascotas que ya marcaron llegada en recepción).
  * Columnas: Hora, Mascota, Cliente, Servicio, Estado.
* **Acciones:**
  * Abrir ficha clínica previa (Lectura de antecedentes).
  * Iniciar atención formal.
* **Reglas de Negocio:**
  * La acción "Iniciar atención" actualiza de forma automática el estado de la cita en el sistema global a **En atención**.

#### Pantalla: Atención Clínica Activa
* **Roles:** Veterinario.
* **Propósito:** Espacio de trabajo e introducción de datos durante el desarrollo de la consulta médica.
* **Datos Visibles:**
  * Panel lateral: Resumen de la mascota, Antecedentes, Alertas críticas (Alergias/Crónicos) e Historial de consultas pasadas.
  * Panel central: Formulario de toma de signos y evolución clínica.
* **Campos del Formulario:**
  * *Signos vitales:* Peso actual, Temperatura, Frecuencia cardíaca.
  * *Evolución:* Observaciones de ingreso, Motivo de consulta, Hallazgos del examen físico, Diagnóstico clínico, Tratamiento sugerido, Medicación prescrita, Recomendaciones generales, Fecha sugerida de próximo control.
* **Acciones:**
  * Guardar borrador interno.
  * Cerrar atención médica (Finalizar consulta).
* **Estados:** Cargando ficha clínica, Validación clínica obligatoria, Éxito al cerrar.
* **Reglas de Negocio:**
  * Exclusividad: Solo el médico veterinario asignado a la cita tiene privilegios de edición mientras la consulta permanezca en estado "En atención".
  * Al ejecutar "Cerrar atención", la cita cambia automáticamente a estado **Completada**, la información se bloquea y pasa a modo de **Solo Lectura** de manera irreversible para garantizar la integridad del expediente médico.

#### Pantalla: Historial Clínico de Mascota
* **Roles:** Veterinario, Cliente (Modo solo lectura con visualización adaptada desde su portal).
* **Propósito:** Consulta histórica completa del expediente de salud del paciente.
* **Datos Visibles:**
  * Línea de tiempo cronológica inversa de atenciones previas.
  * Detalle por tarjeta: Fecha, Médico tratante, Diagnóstico, Tratamiento, Alertas, Próximo control.
* **Acciones:**
  * Expandir / Ver detalle completo de una atención específica.
* **Reglas de Negocio:**
  * Acceso de Solo Lectura absoluto tanto para el Cliente como para cualquier Veterinario una vez que el registro ha sido cerrado formalmente.

---

### 💳 Módulo 7 — Pagos y Cobros

#### Pantalla: Cobros Pendientes
* **Roles:** Recepcionista, Administrador.
* **Propósito:** Cola de facturación que lista las consultas médicas finalizadas que requieren el registro de pago.
* **Datos Visibles:**
  * Tabla de deudas activas: Cliente, Mascota, Servicio brindado, Veterinario que atendió, Fecha, Monto sugerido (derivado del catálogo de servicios), Estado de pago.
* **Acciones:**
  * Registrar cobro presencial.
  * Ver historial de transacciones previas asociadas a la cita.
* **Estados:** Sin cobros pendientes en la cola del día.

#### Pantalla: Registrar Cobro
* **Roles:** Recepcionista, Administrador.
* **Propósito:** Formulario de captura para asentar la recaudación financiera (total o parcial).
* **Datos Visibles:**
  * Datos informativos de la cita, Precio base sugerido, Saldo actualmente pendiente.
* **Campos Editables (Formulario de Recaudación):**
  * Monto final a cobrar.
  * Método de pago (Efectivo, Tarjeta de Crédito/Débito, Transferencia bancaria, Pago digital/Wallet).
  * Número de operación/referencia (Opcional).
  * Observación interna (Opcional).
* **Acciones:**
  * Registrar pago total (Liquida la deuda).
  * Registrar pago parcial (Genera saldo restante).
  * Generar e imprimir comprobante en formato PDF.
* **Estados:** Validación de coherencia de montos, Confirmación de procesamiento de pago, Confirmación de saldo restante devuelto por API.
* **Reglas de Negocio:**
  * Esta pantalla solo puede invocarse si la cita asociada se encuentra en estado **Completada**.
  * Regla de validación en frontend: No se aceptan montos negativos ni iguales a cero.
  * Si el monto final ingresado difiere del precio base sugerido en el catálogo, el campo de "Observación" pasa a ser estrictamente obligatorio para justificar el cambio de precio (descuentos, recargos por insumos, etc.).
  * **Seguridad PCI:** Queda estrictamente prohibido capturar, mostrar o almacenar dígitos completos de tarjetas de crédito o débito en la interfaz de usuario.

#### Pantalla: Historial de Pagos
* **Roles:** Administrador. *(El Cliente cuenta con acceso exclusivo a su historial desde su propio portal)*.
* **Propósito:** Registro y auditoría contable de ingresos económicos.
* **Datos Visibles:**
  * Tabla de transacciones: Fecha/Hora, Cliente, Mascota, Servicio asociado, Método de pago empleado, Monto recaudado, Estado de la transacción (Válido / Anulado).
* **Acciones:**
  * Filtrado avanzado por rangos de fecha y método de pago.
  * Visualizar detalle del comprobante de pago.
  * Descargar comprobante en formato PDF.
  * Anular pago (Acción crítica restringida).
* **Estados:** Sin registros financieros para el rango seleccionado.
* **Reglas de Negocio:**
  * El portal de clientes filtra de manera estricta para mostrar única y exclusivamente los pagos vinculados a su ID de usuario.

#### Pantalla: Anular Pago
* **Roles:** Administrador.
* **Propósito:** Revertir contablemente un cobro registrado por error o cancelación de servicio.
* **Datos Visibles:**
  * Tarjeta de resumen de la transacción original a revertir.
  * Campo obligatorio: Motivo de la anulación técnica.
* **Acciones:**
  * Confirmar anulación irreversible.
* **Reglas de Negocio:**
  * Acción exclusiva para usuarios con rol de Administrador.
  * El flujo exige registrar el motivo de la anulación para poblar las tablas de auditoría del sistema. El estado final del pago pasará a ser **Anulado**.

---

### 🔔 Módulo 8 — Notificaciones

#### Pantalla: Centro de Notificaciones Internas
* **Roles:** Recepcionista, Veterinario, Administrador, Cliente (en su portal).
* **Propósito:** Centro de mensajes y alertas operativas del sistema en tiempo real.
* **Datos Visibles:**
  * Listado de notificaciones: Icono por tipo (Alerta, Información, Confirmación), Mensaje, Fecha/Hora de emisión, Estado (Leída/No leída), Enlace directo a la entidad asociada.
* **Acciones:**
  * Marcar notificación individual como leída.
  * Marcar todas las notificaciones como leídas.
  * Hacer clic para abrir el detalle de la entidad relacionada (Ej. Cita, Ficha).
* **Reglas de Negocio:**
  * En la fase inicial del producto, el alcance cubre alertas internas embebidas en el sistema y el disparo automatizado de correos electrónicos transaccionales.

#### Pantalla: Preferencias de Notificación
* **Roles:** Cliente.
* **Propósito:** Otorgar autonomía al cliente sobre los canales y tipos de avisos que desea recibir.
* **Datos Visibles:**
  * Configuración mediante selectores (Toggles): Recordatorios de citas, Boletines informativos, Avisos de campañas de vacunación.
* **Acciones:**
  * Guardar preferencias de comunicación.
  * Restablecer valores por defecto.
* **Reglas de Negocio:**
  * El sistema bloqueará la desactivación de notificaciones catalogadas como "Críticas" (ej. confirmación de reserva, alertas de deudas pendientes o cancelaciones de última hora).

---

### 💻 Módulo 9 — Portal del Cliente

#### Pantalla: Dashboard del Cliente
* **Roles:** Cliente (Autenticado).
* **Propósito:** Página de bienvenida y consola central de autogestión para el usuario final.
* **Datos Visibles:**
  * Bloque superior: Tarjeta de bienvenida personalizada.
  * Bloque central: Carrusel o lista de sus Mascotas registradas.
  * Sección de Próximas Citas Médicas vigentes.
  * Banner de Alertas Activas (Vacunas vencidas, desparasitaciones sugeridas).
  * **Accesos Directos de Alta Frecuencia:** Solicitar Nueva Cita, Mis Pagos, Historial Clínico de Mascotas, Configurar Mi Perfil.
* **Estados:** Cliente sin mascotas registradas (desplegar onboarding guiado), Cliente sin próximas citas.

#### Pantalla: Mis Mascotas (Portal)
* **Roles:** Cliente.
* **Propósito:** Mostrar una galería o listado enfocado de los animales bajo la tutela del cliente.
* **Datos Visibles:**
  * Tarjetas de mascotas con: Fotografía (si está disponible), Nombre, Especie/Raza, Edad calculada.
* **Acciones:**
  * Ver ficha de datos básica e historial médico restringido.
  * Registrar nueva mascota en el sistema de la clínica.
* **Reglas de Negocio:**
  * Filtro estricto por ID de sesión: Queda prohibida la exposición de cualquier mascota que no pertenezca legalmente al cliente logueado.

#### Pantalla: Mis Citas (Portal)
* **Roles:** Cliente.
* **Propósito:** Seguimiento histórico y control de agendas solicitadas por el cliente.
* **Datos Visibles:**
  * Tabla/Lista cronológica: Estado de la cita (Pendiente, Confirmada, Completada, Cancelada), Fecha, Hora, Mascota asociada, Servicio solicitado.
* **Acciones:**
  * Ver detalle resumido de la cita.
  * Cancelar cita (Sujeto a políticas de tiempo de anticipación del backend).
* **Reglas de Negocio:**
  * El cliente tiene el acceso totalmente restringido a la pantalla de la agenda interna global o de otros usuarios.

#### Pantalla: Mis Pagos (Portal)
* **Roles:** Cliente.
* **Propósito:** Transparencia financiera y consulta de egresos realizados en la clínica.
* **Datos Visibles:**
  * Historial: Fecha de pago, Monto exacto abonado, Concepto/Servicio, Método de pago utilizado.
* **Acciones:**
  * Visualizar recibo en pantalla.
  * Descargar comprobante legal en formato PDF.

#### Pantalla: Mi Perfil (Portal)
* **Roles:** Cliente.
* **Propósito:** Permitir al usuario mantener actualizados sus datos personales de contacto de manera autónoma.
* **Datos Visibles:**
  * Formulario: Nombre completo, Teléfono, Dirección de domicilio, Campos para cambio seguro de contraseña, Campo de correo electrónico (Lectura protegida).
* **Acciones:**
  * Actualizar datos del perfil.
  * Ejecutar cambio de contraseña de seguridad.
* **Reglas de Negocio:**
  * El correo electrónico de la cuenta no puede ser alterado directamente por el usuario sin pasar por un flujo mandatorio de doble verificación de identidad (OTP / Enlace de confirmación).

---

### 📊 Módulo 10 — Reportes y Dashboard

#### Pantalla: Dashboard Diario Operativo
* **Roles:** Administrador, Recepcionista (Con matriz de visualización parcial restringida).
* **Propósito:** Monitorización en tiempo real de la productividad diaria de la clínica veterinaria.
* **Datos Visibles (Métricas Clave):**
  * Contador total de citas programadas para el día actual.
  * Desglose numérico por estados: Pendientes de confirmación, Confirmadas, Completadas, Canceladas, Inasistencias (No show).
  * Indicador financiero de Recaudación Total del Día (Exclusivo Admin).
  * Contador de Cobros Pendientes acumulados en la jornada.
* **Acciones:**
  * Clic en métricas para navegar a los listados detallados correspondientes.
* **Reglas de Negocio:**
  * El rol de Recepcionista posee visibilidad del panel operativo diario, pero tiene bloqueada la visualización de las métricas financieras globales o reportes consolidados de facturación.

#### Pantalla: Reporte de Citas
* **Roles:** Administrador, Recepcionista (Sujeto a permisos del rol).
* **Propósito:** Herramienta analítica para auditar el volumen y comportamiento de las citas en el tiempo.
* **Datos Visibles:**
  * Tabla analítica interactiva: Fecha de ejecución, Cliente, Mascota, Servicio, Veterinario asignado, Estado final de cierre.
* **Acciones:**
  * Aplicar filtros combinados: Rango de fechas, Veterinario, Estado de la cita, Servicio comercial.
  * Exportar datos (Formatos de reporte soportados).
* **Estados:** Sin resultados bajo los criterios de filtrado seleccionados.
* **Reglas de Negocio:**
  * Este reporte es estrictamente de naturaleza administrativa y operativa. Bajo ninguna circunstancia debe exponer campos de texto de hallazgos clínicos o notas médicas privadas.

#### Pantalla: Reporte de Pagos
* **Roles:** Administrador.
* **Propósito:** Auditoría e inteligencia financiera del negocio veterinario.
* **Datos Visibles:**
  * Indicadores consolidados: Monto total cobrado, Desglose porcentual y numérico por método de pago utilizado, Cartera de pagos pendientes de cobro.
  * Tabla dinámica filtrable por fechas, métodos de pago y estados de transacción.
* **Acciones:**
  * Exportar reporte contable consolidado.
* **Reglas de Negocio:**
  * Acceso restringido con máxima severidad. Solo el rol de Administrador puede renderizar esta pantalla y sus datos relacionados.

#### Pantalla: Estadísticas Operativas
* **Roles:** Administrador.
* **Propósito:** Análisis estratégico del rendimiento a mediano y largo plazo del negocio.
* **Datos Visibles (Gráficos/Métricas Consolidadas):**
  * Ranking de servicios comerciales más solicitados por la clientela.
  * Carga operativa y eficiencia por médico veterinario (Volumen de atenciones).
  * Tasa de retención e identificación de clientes frecuentes.
  * Métrica de No Asistencia (Porcentaje de "No Show") histórico.
  * Mapa de calor de días y horas pico de demanda.
* **Acciones:**
  * Cambiar período temporal de análisis (Mes actual, trimestre, año, rango personalizado).
  * Exportar gráficos analíticos si aplica.
* **Reglas de Negocio:**
  * Pantalla orientada al rendimiento comercial. Se prohíbe de manera explícita la inclusión o renderizado de información médica o diagnósticos clínicos sensibles de los pacientes.

---

## 🛠️ Criterios de Aceptación para Stitch

Al procesar esta especificación en Stitch, se deben cumplir los siguientes lineamientos de forma rigurosa:

* 🧩 **Unicidad de Componentes:** Generar y compilar una sola pantalla a la vez para asegurar un código frontend modular, mantenible y libre de acoplamientos innecesarios.
* 📋 **Fidelidad Absoluta:** No inventar campos, formularios, ni entradas de datos que estén fuera de los requerimientos explícitamente citados en este documento.
* 🔄 **Consistencia de Negocio:** Queda estrictamente prohibido introducir estados lógicos de negocio o flujos alternos que contradigan el UML central o esta especificación.
* 🩺 **Tono del Producto:** La interfaz y los textos predeterminados deben mantener un tono corporativo, profesional, empático y limpio, idóneo para el sector de la salud y el cuidado de mascotas pequeñas.

