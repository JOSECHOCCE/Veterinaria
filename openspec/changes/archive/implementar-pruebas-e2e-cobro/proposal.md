# Propuesta: Implementación de Prueba E2E para Registro de Cobro con Llenado Automático (Autofill)

Esta propuesta detalla el alcance y diseño para automatizar la **Prueba E2E 7: Registro de Cobro y Autofill (Caja)** utilizando Playwright.

---

## 1. Alcance del Cambio
* **Objetivo:** Simular en el navegador el flujo operativo en caja que realiza el Recepcionista o Administrador cuando se finaliza una atención médica y se emite la alerta en tiempo real.
* **Componentes Afectados:**
  - `src/Frontend/playwright/tests/registro-cobro-autofill.spec.ts` [NEW] — El script de prueba Playwright.
  - Modificación de elementos en `src/Frontend/src/views/Pagos/RegistrarCobro.tsx` si es necesario para agregar selectores de prueba (`data-testid`).

---

## 2. Flujo de la Prueba
1. Iniciar sesión como **Recepcionista** (`recepcionista@veterinaria.com` / `Recepcion123!`).
2. Navegar a la sección de cobros o simular la recepción de la notificación SignalR de cierre de consulta.
3. Hacer clic en el botón de la notificación (**Aceptar**) para ir a `/admin/pagos/registrar/:id?autofill=true`.
4. Verificar que se despliega el banner *"⚡ Llenado Automático Habilitado"*.
5. Comprobar que los campos de total, abono, método de pago y la observación obligatoria están pre-cargados.
6. Guardar el cobro y confirmar la creación del recibo.

---

## 3. Riesgos y Alternativas
* **Riesgo:** La notificación SignalR depende de que un veterinario termine una consulta en el mismo instante.
* **Solución / Alternativa:** El test creará una cita y un triaje mediante API (o simulando las llamadas correspondientes en la base de datos) o simplemente navegará de forma directa a la URL `/admin/pagos/registrar/1?autofill=true` para validar la lógica del formulario de cobro y luego simular el flujo completo. Elegimos navegar directo con un ID de cita existente en la base de datos de desarrollo (ej. Cita #1) para asegurar un test robusto y no-flaky.
