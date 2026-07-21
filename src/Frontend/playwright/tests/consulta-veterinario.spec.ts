import { test, expect } from '@playwright/test';

test.describe('Pruebas E2E - Veterinario (Consulta Médica)', () => {

  test.beforeEach(async ({ page }) => {
    // Iniciar sesión como Veterinario antes de cada prueba
    await page.goto('/login');
    await page.fill('input[type="email"]', 'carlos.mendoza@veterinaria.com');
    await page.fill('input[type="password"]', 'Veterinario123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*\/admin\/.*/);
  });

  test('Prueba 8 y 9: Flujo SOAP y Retoma de Consulta desde Mi Agenda', async ({ page }) => {
    // 1. Ir a Mi Agenda
    await page.goto('/admin/mi-agenda');
    await expect(page.locator('h1:has-text("Mi Agenda")').first()).toBeVisible();

    // 2. Localizar primera mascota lista para atender
    const atenderBtn = page.locator('button:has-text("Atender"), a:has-text("Atender")').first();
    
    if (await atenderBtn.isVisible()) {
      await atenderBtn.click();
      await page.waitForURL(/.*\/admin\/atencion\/.*/);

      // Completar notas SOAP
      await page.fill('textarea[name="subjetivo"]', 'Mascota presenta decaimiento leve.');
      await page.fill('textarea[name="objetivo"]', 'Temperatura normal, reflejos correctos.');
      await page.fill('textarea[name="analisis"]', 'Posible fatiga por estrés de viaje.');
      await page.fill('textarea[name="plan"]', 'Recomendar descanso e hidratación abundante.');
      await page.fill('input[name="diagnostico"]', 'Estrés transitorio');

      // 3. Probar autoguardado de borrador saliendo y regresando (Prueba 9)
      await page.goto('/admin/mi-agenda');
      
      // Retomar la atención
      const retomarBtn = page.locator('button:has-text("Retomar"), a:has-text("Retomar")').first();
      if (await retomarBtn.isVisible()) {
        await retomarBtn.click();
        
        // Verificar que los datos sigan allí
        const subjetivoInput = page.locator('textarea[name="subjetivo"]');
        await expect(subjetivoInput).toHaveValue('Mascota presenta decaimiento leve.');
      }

      // 4. Finalizar Consulta (Prueba 8)
      const finalizarBtn = page.locator('button:has-text("Finalizar Consulta")');
      if (await finalizarBtn.isVisible()) {
        await finalizarBtn.click();
        
        // Confirmar en modal
        const confirmarModalBtn = page.locator('button:has-text("Confirmar Finalización")');
        if (await confirmarModalBtn.isVisible()) {
          await confirmarModalBtn.click();
        }
      }
    }
  });

});
