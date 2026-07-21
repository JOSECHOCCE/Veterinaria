# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: portal-cliente.spec.ts >> Pruebas E2E - Portal Cliente / Tutor >> Prueba 2: Solicitud de Cita Médica en Línea
- Location: src\Frontend\playwright\tests\portal-cliente.spec.ts:39:3

# Error details

```
Error: page.goto: net::ERR_NETWORK_CHANGED at http://localhost:5132/login
Call log:
  - navigating to "http://localhost:5132/login", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Pruebas E2E - Portal Cliente / Tutor', () => {
  4  |   
  5  |   test('Prueba 1: Registro de nuevo Tutor y Mascota', async ({ page }) => {
  6  |     // 1. Ir a la página de registro
  7  |     await page.goto('/register');
  8  |     
  9  |     // Generar un email único para evitar colisiones
  10 |     const uniqueEmail = `tutor.${Date.now()}@test.com`;
  11 |     
  12 |     // Rellenar formulario de tutor
  13 |     await page.fill('input#nombreCompleto', 'Juan Pérez García');
  14 |     await page.fill('input#email', uniqueEmail);
  15 |     await page.fill('input#password', 'Tutor123!');
  16 |     await page.fill('input#telefono', '999888777');
  17 |     await page.fill('input#documento', '45781293');
  18 |     await page.fill('input#direccion', 'Av. Larco 123, Miraflores');
  19 |     
  20 |     // Aceptar términos y condiciones
  21 |     await page.click('input[type="checkbox"]');
  22 |     
  23 |     // Registrarse
  24 |     await page.click('button[type="submit"]');
  25 |     
  26 |     // 2. Comprobar redirección al login tras registro exitoso
  27 |     await page.waitForURL(/.*\/login/);
  28 |     
  29 |     // 3. Iniciar sesión con la cuenta creada
  30 |     await page.fill('input[type="email"]', uniqueEmail);
  31 |     await page.fill('input[type="password"]', 'Tutor123!');
  32 |     await page.click('button[type="submit"]');
  33 |     
  34 |     // Redirigir al portal
  35 |     await page.waitForURL(/.*\/cliente\/portal/);
  36 |     await expect(page.locator('text=Bienvenido')).toBeVisible();
  37 |   });
  38 | 
  39 |   test('Prueba 2: Solicitud de Cita Médica en Línea', async ({ page }) => {
  40 |     // 1. Iniciar sesión como tutor de prueba pre-existente
> 41 |     await page.goto('/login');
     |                ^ Error: page.goto: net::ERR_NETWORK_CHANGED at http://localhost:5132/login
  42 |     await page.fill('input[type="email"]', 'usuario@test.com');
  43 |     await page.fill('input[type="password"]', 'Usuario123!');
  44 |     await page.click('button[type="submit"]');
  45 |     
  46 |     // 2. Ir directamente a la pantalla de agendamiento
  47 |     await page.waitForURL(/.*\/cliente\/portal/);
  48 |     await page.goto('/cliente/nueva-cita');
  49 |     
  50 |     // Paso 1: Seleccionar mascota (ya viene pre-seleccionada)
  51 |     const nextBtn1 = page.locator('button:has-text("Siguiente Paso")');
  52 |     await expect(nextBtn1).toBeVisible();
  53 |     await nextBtn1.click();
  54 |     
  55 |     // Paso 2: Seleccionar servicio (ya viene pre-seleccionado)
  56 |     const nextBtn2 = page.locator('button:has-text("Siguiente Paso")');
  57 |     await expect(nextBtn2).toBeVisible();
  58 |     await nextBtn2.click();
  59 | 
  60 |     // Paso 3: Seleccionar veterinario (ya viene pre-seleccionado)
  61 |     const nextBtn3 = page.locator('button:has-text("Siguiente Paso")');
  62 |     await expect(nextBtn3).toBeVisible();
  63 |     await nextBtn3.click();
  64 |     
  65 |     // Avanzar o completar formulario de cita
  66 |     // Si hay un modal o wizard, completamos los selects de veterinario/servicio
  67 |     const selectServicio = page.locator('select').nth(1);
  68 |     if (await selectServicio.isVisible()) {
  69 |       await selectServicio.selectOption({ index: 1 });
  70 |     }
  71 |     
  72 |     // Clic en enviar solicitud
  73 |     const submitBtn = page.locator('button:has-text("Solicitar Cita"), button:has-text("Confirmar")');
  74 |     if (await submitBtn.isVisible()) {
  75 |       await submitBtn.click();
  76 |     }
  77 |   });
  78 | 
  79 |   test('Prueba 3: Pasarela de Pago del Cliente', async ({ page }) => {
  80 |     // 1. Iniciar sesión como tutor
  81 |     await page.goto('/login');
  82 |     await page.fill('input[type="email"]', 'usuario@test.com');
  83 |     await page.fill('input[type="password"]', 'Usuario123!');
  84 |     await page.click('button[type="submit"]');
  85 |     
  86 |     // 2. Ir a Mis Pagos
  87 |     await page.waitForURL(/.*\/cliente\/portal/);
  88 |     await page.goto('/cliente/mis-pagos');
  89 |     
  90 |     // 3. Validar visibilidad de saldo o lista de pagos
  91 |     await expect(page.locator('text=Gasto Total')).toBeVisible();
  92 |   });
  93 | 
  94 | });
  95 | 
```