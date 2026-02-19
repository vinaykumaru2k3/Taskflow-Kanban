import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Using 127.0.0.1 is more stable in CI than 'localhost'
  workers: process.env.CI ? 2 : undefined,
  reporter: 'html',
  timeout: 60000,

  expect: {
    timeout: 10000,
  },

  use: {
    // Standardize on 127.0.0.1 to avoid IPv6 resolution hangs
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
  },

webServer: {
    // Uses the 'serve' package you already have in devDependencies
    command: process.env.CI ? 'npm run preview -- --port 3000' : 'npm run dev',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});