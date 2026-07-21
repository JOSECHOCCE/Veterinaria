# Diseño Técnico: Prueba E2E de Cobro con Llenado Automático

Este documento detalla el diseño técnico del script de prueba y las interacciones con el navegador.

---

## 1. Diseño del Script de Prueba
* **Archivo:** `src/Frontend/playwright/tests/registro-cobro-autofill.spec.ts`
* **Localizadores clave (Selectors):**
  - Input Email: `input[type="email"]`
  - Input Password: `input[type="password"]`
  - Botón de submit de login: `button[type="submit"]`
  - Contenedor del banner de autofill: `text=Llenado Automático Habilitado`
  - Input de observación: `textarea#observacion` o `textarea` con etiqueta "Observaciones" (comprobaremos su contenido).
  - Botón de registro de cobro: `button:has-text("Registrar Cobro")` o `button:has-text("Registrar e Imprimir Comprobante")`.

---

## 2. Flujo Lógico de Codificación
```typescript
import { test, expect } from '@playwright/test';

test.describe('Pruebas E2E - Recepcionista Caja', () => {
  test('Prueba 7: Llenado automático de cobro al acceder con autofill=true', async ({ page }) => {
    // 1. Iniciar sesión como recepcionista
    await page.goto('/login');
    await page.fill('input[type="email"]', 'recepcionista@veterinaria.com');
    await page.fill('input[type="password"]', 'Recepcion123!');
    await page.click('button[type="submit"]');

    // 2. Esperar redirección al portal de administración
    await page.waitForURL(/.*\/admin\/.*/);

    // 3. Navegar directamente con autofill=true
    await page.goto('/admin/pagos/registrar/1?autofill=true');

    // 4. Verificar que aparezca el banner de llenado automático
    await expect(page.locator('text=Llenado Automático Habilitado')).toBeVisible();

    // 5. Verificar que el campo observación contenga el texto pre-cargado
    const observacionTextarea = page.locator('textarea[name="observacion"]');
    // Si no tiene name="observacion", buscaremos el placeholder o elemento correspondiente
    // Comprobar que el valor no sea vacío y contenga justificación estándar
    await expect(observacionTextarea).not.toBeEmpty();

    // 6. Verificar que el total y el monto a abonar estén cargados
    const totalAjustado = page.locator('input[name="montoTotalAjustado"]');
    await expect(totalAjustado).not.toBeEmpty();
  });
});
```
