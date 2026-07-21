import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './playwright/tests',
  outputDir: './playwright/results', // Carpeta para videos, capturas y trazas
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { outputFolder: './playwright/report' }]], // Carpeta para el reporte HTML
  use: {
    baseURL: 'http://localhost:5132',
    screenshot: 'on',
    video: 'on',
    trace: 'on',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
