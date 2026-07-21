import { test, expect } from '@playwright/test';

test.describe('Pruebas E2E - Rol Veterinario', () => {
  test('Prueba 10: Veterinario debe tener restringido agendar citas y ver botón en detalle de mascota', async ({ page }) => {
    // 1. Iniciar sesión como veterinario
    await page.goto('/login');
    
    // Esperar a que los inputs estén visibles
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    
    await emailInput.fill('carlos.mendoza@veterinaria.com');
    await page.fill('input[type="password"]', 'Veterinario123!');
    await page.click('button[type="submit"]');

    // 2. Esperar que redirija a la agenda médica o cola
    await page.waitForURL(/.*\/admin\/(mi-agenda|cola)/);
    
    // 3. Intentar ingresar directamente a la URL de nueva cita
    await page.goto('/admin/agenda/nueva');

    // 4. Verificar que se muestre la advertencia de Acceso Restringido
    await expect(page.locator('text=Acceso Restringido para Veterinarios')).toBeVisible();
    await expect(page.locator('text=La programación y agendamiento de nuevas citas')).toBeVisible();

    // 5. Ir a la ficha de una mascota (ej. /admin/mascotas/1/historial)
    await page.goto('/admin/mascotas/1/historial');
    
    // 6. Verificar que el botón "Agendar Cita" NO esté presente para el Veterinario
    await expect(page.locator('button:has-text("Agendar Cita")')).not.toBeVisible();
    await expect(page.locator('a:has-text("Agendar Cita")')).not.toBeVisible();
  });
});
