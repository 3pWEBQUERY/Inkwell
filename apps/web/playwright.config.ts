import { defineConfig, devices } from '@playwright/test';

/**
 * The five core flows (register, write private, share anonymously, burn,
 * export) against a running stack. CI starts api + web with a Postgres service;
 * locally run `pnpm dev` in both apps first and set E2E_BASE_URL. A pre-installed
 * Chromium can be used through PLAYWRIGHT_CHROMIUM_PATH instead of downloading one.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'retain-on-failure',
    locale: 'de-CH',
    ...(process.env.PLAYWRIGHT_CHROMIUM_PATH
      ? { launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } }
      : {}),
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
});
