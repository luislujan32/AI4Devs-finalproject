import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'scripts/e2e',
  outputDir: '.local/e2e-results',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  reporter: 'list',
  workers: 1,
  forbidOnly: !!process.env.CI,
  use: { browserName: 'chromium' },
});
