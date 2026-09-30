import { defineConfig, devices } from '@playwright/test';

// Las pruebas de extremo a extremo levantan la API (con una base en memoria cargada
// desde test-data/) y la web, y recorren el portal como lo haría un vendedor.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'npm run start -w apps/api',
      url: 'http://localhost:3001/api/salud',
      env: { PORTAL_DB: ':memory:' },
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: 'npm run dev -w apps/web',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
});
