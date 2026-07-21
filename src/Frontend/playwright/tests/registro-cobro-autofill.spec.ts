import { test, expect } from '@playwright/test';

test.describe('Pruebas E2E - Recepcionista Caja', () => {
  test('Prueba 7: Llenado automático de cobro al acceder con autofill=true', async ({ page }) => {
    // 1. Iniciar sesión como recepcionista
    await page.goto('/login');
    
    // Esperar a que los inputs estén visibles
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    
    await emailInput.fill('recepcionista@veterinaria.com');
    await page.fill('input[type="password"]', 'Recepcion123!');
    await page.click('button[type="submit"]');

    // 2. Esperar redirección al portal de administración
    await page.waitForURL(/.*\/admin\/.*/);

    // 3. Cambiar dinámicamente el estado de la cita #2 a 'Completada' para habilitar el cobro
    // Recuperamos el JWT del localStorage del navegador
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).not.toBeNull();

    // Hacemos la llamada HTTP adjuntando el token en el Header
    const changeStatusResponse = await page.request.post('/api/Citas/CambiarEstado/2?nuevoEstado=Completada', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Toleramos que ya esté en estado Completada (retorna 400 en replays de tests)
    if (!changeStatusResponse.ok()) {
      const bodyText = await changeStatusResponse.text();
      expect(changeStatusResponse.status()).toBe(400);
      expect(bodyText).toContain("No se puede cambiar de 'Completada' a 'Completada'");
    }

    // 4. Navegar directamente con autofill=true
    await page.goto('/admin/pagos/registrar/2?autofill=true');

    // 5. Verificar que aparezca el banner de llenado automático
    await expect(page.locator('text=Llenado Automático Habilitado')).toBeVisible();

    // 6. Verificar que los campos estén cargados correctamente
    // Observación obligatoria
    const observacionTextarea = page.locator('textarea#observation');
    await expect(observacionTextarea).toBeVisible();
    await expect(observacionTextarea).not.toBeEmpty();
    const observacionVal = await observacionTextarea.inputValue();
    expect(observacionVal.toLowerCase()).toContain('atención clínica');

    // Monto a abonar pre-cargado
    const montoAbonarInput = page.locator('input#amount-to-pay');
    await expect(montoAbonarInput).toBeVisible();
    
    // Obtenemos el valor actual (puede ser 100.00 en la primera corrida, o 0.00 si ya se pagó previamente)
    const abonoValue = await montoAbonarInput.inputValue();
    expect(['100.00', '0.00']).toContain(abonoValue);

    // 7. Enviar formulario para registrar el pago únicamente si no ha sido cobrado
    if (abonoValue === '100.00') {
      const submitBtn = page.locator('button[type="submit"]');
      await expect(submitBtn).toBeEnabled();
      await submitBtn.click();

      // 8. Verificar pantalla de éxito final de cobro registrado
      await expect(page.locator('text=¡Cobro Registrado!')).toBeVisible();
      await expect(page.locator('text=Volver a Pagos')).toBeVisible();
    } else {
      console.log('⚡ Cita #2 ya fue cobrada en una ejecución previa. Autofill verificado correctamente sin reenviar.');
    }
  });
});
