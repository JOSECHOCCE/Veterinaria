# 1. Requisitos del Sistema y Reglas de Negocio (VetCare Pro)

Este documento define la base de requisitos funcionales y reglas de negocio obligatorias para el sistema VetCare Pro.

---

## 1. Módulo de Autenticación, Usuarios y Roles
El sistema maneja dos roles primarios utilizando ASP.NET Core Identity y tokens JWT:
* **Administrador (Admin)**: Personal administrativo y veterinarios de la clínica. Tienen control total sobre todos los recursos, configuraciones y la cola médica.
* **Usuario (Cliente)**: Propietarios de mascotas. Solo pueden ver y administrar sus mascotas asociadas, agendar citas para ellas, simular sus pagos y consultar sus notificaciones o historiales clínicos.

---

## 2. Módulo de Mascotas
Cada mascota está asociada obligatoriamente a un propietario (`Usuario`).
* **Datos básicos**: Nombre, Especie, Raza, Fecha de Nacimiento, Peso Estimado, Color y FotoUrl.
* **Estados**: Activo/Inactivo (eliminación lógica).

---

## 3. Módulo de Citas Médicas y Agenda
Este es el núcleo transaccional del sistema.
* **Ciclo de vida de una cita**:
  `Pendiente` ➔ `Confirmada` (tras recibir pago mínimo del 50%) ➔ `EnProceso` (mascota ingresa a consulta) ➔ `Completada` (consulta finalizada, mascota lista para ser recogida) o `Cancelada` (libera el slot horario).
* **Validaciones críticas de la agenda (Reglas de Negocio)**:
  1. **Duración por Servicio**: Cada servicio tiene una duración en minutos específica (ej. Baño = 60 min, Cirugía Menor = 120 min). Al agendar, el sistema debe asegurar que el veterinario tenga suficientes bloques consecutivos de 30 minutos libres para completar el servicio.
  2. **Bloqueo por Deuda**: Si la mascota seleccionada tiene una cita previa finalizada (`Completada`) cuyo estado de pago sea `Parcial` (saldo pendiente), el sistema **bloquea automáticamente** la agendación de nuevas citas para esa mascota hasta que la deuda sea liquidada.
  3. **Horario del Veterinario**: Las citas solo pueden agendarse dentro de la ventana de inicio y fin de turno del veterinario asignado, excluyendo domingos y fechas pasadas.

---

## 4. Módulo de Triage y Emergencias
Permite el ingreso prioritario de mascotas a la clínica en situaciones de urgencia sin necesidad de cita previa.
* **Niveles de Triage**:
  * **N1 (Emergencia - Rojo)**: Tiempo de espera estimado de 0 minutos. Atención inmediata en Sala de Shock.
  * **N2 (Urgente - Naranja)**: Tiempo de espera estimado menor a 15 minutos.
  * **N3 (No Urgente - Verde)**: Tiempo de espera regular.
* **Cola de Triage**: La cola activa (`EnEspera`, `EnAtencion`) debe mostrar las mascotas ordenadas estrictamente por prioridad de gravedad (N1 ➔ N2 ➔ N3) y luego por fecha de llegada (`FechaRegistro`).

---

## 5. Módulo de Pagos y Simulación Financiera
El precio total de la cita se establece según el precio del servicio reservado.
* **Modalidad de pago**:
  * **Pago Completo (100%)**: El estado de pago cambia directamente a `Pagado`.
  * **Pago Parcial (50%)**: Se paga la mitad al reservar. El estado de la cita cambia a `Confirmada` con `EstadoPago = Parcial`. El 50% restante se liquida al finalizar la consulta para poder retirar a la mascota.
* **Simulación de Tarjetas**: Se permite simular transacciones bancarias ingresando número de tarjeta, titular, expiración y CVV. El usuario puede marcar "Guardar tarjeta" para que se almacene cifrada una representación básica de los últimos 4 dígitos y se autocomplete en futuras citas.

---

## 6. Módulo de Notificaciones y Tiempo Real
El sistema emite notificaciones instantáneas mediante SignalR en los siguientes hitos de negocio:
1. **Confirmación de Cita**: Al registrarse el pago de reserva.
2. **Atención Iniciada**: Cuando el Admin cambia el estado de la cita a `EnProceso` (notifica al propietario que su mascota está siendo atendida en tiempo real).
3. **Mascota Lista**: Al cambiar a `Completada` (notifica para pasar a recoger a la mascota y recuerda saldo pendiente si aplica).
4. **Pago Recibido**: Al procesarse cobros.
5. **Emergencia en Triage**: Al registrar un triage para un paciente.
