import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,    // Tests share the same seed data — run sequentially
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    baseURL:     'http://localhost:5173',
    headless:    true,
    screenshot:  'only-on-failure',
    trace:       'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Start the full dev stack before running E2E tests.
  // Requires: docker-compose up -d (PostgreSQL) + seeded database.
  webServer: [
    {
      command:            'pnpm --filter backend dev',
      port:               3000,
      reuseExistingServer: !process.env.CI,
      timeout:            60_000,
    },
    {
      command:            'pnpm --filter frontend dev',
      port:               5173,
      reuseExistingServer: !process.env.CI,
      timeout:            30_000,
    },
  ],
});
