# Especificación: Prueba E2E de Registro de Cobro y Autofill

Este documento define el comportamiento esperado y los criterios de aceptación para la automatización del flujo de cobro con llenado automático.

---

## 1. Requerimientos de Comportamiento
* El sistema **MUST** permitir el acceso al formulario de cobros únicamente a usuarios autenticados con los roles de `Recepcionista` o `Admin`.
* Al ingresar a la URL de cobro `/admin/pagos/registrar/:citaId` con el parámetro query `autofill=true`, el sistema **SHALL** pre-cargar todos los campos requeridos para la transacción.
* El formulario **MUST** autocompletar:
  - Tipo de Pago: Completo
  - Método de Pago: Efectivo
  - Monto a abonar: Monto restante de la consulta (montoTotal - montoPagado)
  - Observación: Justificación pre-generada de auditoría.
* El sistema **MUST** desplegar un banner visible informando que el llenado automático está activo.

---

## 2. Escenario de Aceptación (E2E)

* **Given (Dado):** 
  - Que el usuario `Recepcionista` inicia sesión con credenciales válidas en `/login`.
  - Que existe una cita en estado pendiente de cobro con ID `1` en la base de datos local de desarrollo.
* **When (Cuando):**
  - El usuario navega directamente a la URL `/admin/pagos/registrar/1?autofill=true`.
* **Then (Entonces):**
  - La página **MUST** mostrar el título "Registrar Cobro" y el banner *"⚡ Llenado Automático Habilitado (Consulta Médica Finalizada)"*.
  - El campo de texto de la observación **SHALL** contener el valor: *"Atención clínica completada. Cobro estándar de servicio."* o *"Monto calculado automáticamente tras finalizar atención clínica/procedimiento."*.
  - El botón "Registrar e Imprimir Comprobante" **MUST** estar visible y habilitado.
