import { defineConfig, devices } from '@playwright/test';

import e2eConfig from './e2e/config.js';

// Los E2E consultan GitLab real: un solo worker evita gastar rate limit en
// paralelo y mantiene el orden del recorrido.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: e2eConfig.frontendUrl,
    // Sólo se conservan evidencias de fallos y reintentos.
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  // Firefox y WebKit se agregan únicamente ante un requisito de compatibilidad.
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: [
    {
      command: 'npm start --prefix backend',
      url: `${e2eConfig.backendUrl}/health`,
      reuseExistingServer: false,
      timeout: 60_000,
      stdout: 'pipe',
      stderr: 'pipe',
      env: {
        GITLAB_TOKEN: e2eConfig.gitlabToken,
        GITLAB_BASE_URL: e2eConfig.gitlabBaseUrl,
        PROJECT_IDS: e2eConfig.projectIds,
        PORT: String(e2eConfig.backendPort),
      },
    },
    {
      command: `npm run build --prefix frontend && npm run preview --prefix frontend -- --port ${e2eConfig.frontendPort} --strictPort`,
      url: e2eConfig.frontendUrl,
      reuseExistingServer: false,
      timeout: 120_000,
      stdout: 'pipe',
      stderr: 'pipe',
      env: { VITE_API_BASE_URL: e2eConfig.backendUrl },
    },
  ],
});
