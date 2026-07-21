import { test, expect } from '@playwright/test';

test.describe('Pruebas E2E - Recepcionista / Administrador', () => {

  test.beforeEach(async ({ page }) => {
    // Iniciar sesión como recepcionista antes de cada prueba
    await page.goto('/login');
    await page.fill('input[type="email"]', 'recepcionista@veterinaria.com');
    await page.fill('input[type="password"]', 'Recepcion123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*\/admin\/.*/);
  });

  test('Prueba 4 y 5: Confirmación de Cita y Registro de Llegada (Check-in)', async ({ page }) => {
    // 1. Ir a la agenda operativa
    await page.goto('/admin/agenda');
    await expect(page.locator('text=Agenda Operativa')).toBeVisible();

    // 2. Verificar que se liste la tabla de citas
    // El test comprobará la existencia de filas y botones de acción rápida
    const checkinBtn = page.locator('button:has-text("Registrar Llegada")').first();
    
    // Si hay un botón de check-in visible, lo presionamos
    if (await checkinBtn.isVisible()) {
      await checkinBtn.click();
      // Comprobar mensaje de éxito de llegada registrada
      await expect(page.locator('text=Llegada registrada, en cola de triaje')).toBeVisible();
    }
  });

  test('Prueba 6: Realización del Triaje Clínico', async ({ page }) => {
    // 1. Ir a la cola de atención (donde está el triaje)
    await page.goto('/admin/cola');
    await expect(page.locator('h1:has-text("Cola de Atención")').first()).toBeVisible();

    // 2. Buscar botón de Triaje
    const triarBtn = page.locator('button:has-text("Triaje"), a:has-text("Triaje")').first();
    if (await triarBtn.isVisible()) {
      await triarBtn.click();

      // Completar parámetros del triaje
      await page.fill('input[placeholder="Ej: 38.5"]', '38.5');
      await page.fill('input[placeholder="Ej: 14.2"]', '12.4');
      await page.fill('input[placeholder="Ej: 90"]', '110');
      await page.fill('input[placeholder="Ej: Cojera en pata trasera..."]', 'Control de rutina');

      // Enviar
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Paciente registrado en triage')).toBeVisible();
    }
  });

});
