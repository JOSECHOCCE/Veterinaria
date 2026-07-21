import { test, expect } from '@playwright/test';

test.describe('Pruebas E2E - Portal Cliente / Tutor', () => {
  
  test('Prueba 1: Registro de nuevo Tutor y Mascota', async ({ page }) => {
    // 1. Ir a la página de registro
    await page.goto('/register');
    
    // Generar un email único para evitar colisiones
    const uniqueEmail = `tutor.${Date.now()}@test.com`;
    
    // Rellenar formulario de tutor
    await page.fill('input#nombreCompleto', 'Juan Pérez García');
    await page.fill('input#email', uniqueEmail);
    await page.fill('input#password', 'Tutor123!');
    await page.fill('input#telefono', '999888777');
    await page.fill('input#documento', '45781293');
    await page.fill('input#direccion', 'Av. Larco 123, Miraflores');
    
    // Aceptar términos y condiciones
    await page.click('input[type="checkbox"]');
    
    // Registrarse
    await page.click('button[type="submit"]');
    
    // 2. Comprobar redirección al login tras registro exitoso
    await page.waitForURL(/.*\/login/);
    
    // 3. Iniciar sesión con la cuenta creada
    await page.fill('input[type="email"]', uniqueEmail);
    await page.fill('input[type="password"]', 'Tutor123!');
    await page.click('button[type="submit"]');
    
    // Redirigir al portal
    await page.waitForURL(/.*\/cliente\/portal/);
    await expect(page.locator('text=Bienvenido')).toBeVisible();
  });

  test('Prueba 2: Solicitud de Cita Médica en Línea', async ({ page }) => {
    // 1. Iniciar sesión como tutor de prueba pre-existente
    await page.goto('/login');
    await page.fill('input[type="email"]', 'usuario@test.com');
    await page.fill('input[type="password"]', 'Usuario123!');
    await page.click('button[type="submit"]');
    
    // 2. Ir directamente a la pantalla de agendamiento
    await page.waitForURL(/.*\/cliente\/portal/);
    await page.goto('/cliente/nueva-cita');
    
    // Paso 1: Seleccionar mascota (ya viene pre-seleccionada)
    const nextBtn1 = page.locator('button:has-text("Siguiente Paso")');
    await expect(nextBtn1).toBeVisible();
    await nextBtn1.click();
    
    // Paso 2: Seleccionar servicio (ya viene pre-seleccionado)
    const nextBtn2 = page.locator('button:has-text("Siguiente Paso")');
    await expect(nextBtn2).toBeVisible();
    await nextBtn2.click();

    // Paso 3: Seleccionar veterinario (ya viene pre-seleccionado)
    const nextBtn3 = page.locator('button:has-text("Siguiente Paso")');
    await expect(nextBtn3).toBeVisible();
    await nextBtn3.click();
    
    // Avanzar o completar formulario de cita
    // Si hay un modal o wizard, completamos los selects de veterinario/servicio
    const selectServicio = page.locator('select').nth(1);
    if (await selectServicio.isVisible()) {
      await selectServicio.selectOption({ index: 1 });
    }
    
    // Clic en enviar solicitud
    const submitBtn = page.locator('button:has-text("Solicitar Cita"), button:has-text("Confirmar")');
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
    }
  });

  test('Prueba 3: Pasarela de Pago del Cliente', async ({ page }) => {
    // 1. Iniciar sesión como tutor
    await page.goto('/login');
    await page.fill('input[type="email"]', 'usuario@test.com');
    await page.fill('input[type="password"]', 'Usuario123!');
    await page.click('button[type="submit"]');
    
    // 2. Ir a Mis Pagos
    await page.waitForURL(/.*\/cliente\/portal/);
    await page.goto('/cliente/mis-pagos');
    
    // 3. Validar visibilidad de saldo o lista de pagos
    await expect(page.locator('text=Gasto Total')).toBeVisible();
  });

});
