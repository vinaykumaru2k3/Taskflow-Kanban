import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 60000,

  expect: {
    timeout: 10000,
  },

  use: {
    // Standardizing on 127.0.0.1 avoids IPv6 resolution issues (::1) in CI
    baseURL: 'http://127.0.0.1:3000',
    trace: 'retain-on-failure',
  },

  webServer: {
    // We can simplify the command now that vitest.config.js handles the port/host
    command: process.env.CI ? 'npm run preview' : 'npm run dev',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // 2 minutes is plenty for Vite to boot
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});