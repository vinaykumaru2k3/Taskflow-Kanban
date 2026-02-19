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
    // In CI, we want to serve the 'dist' folder. 
    // Locally, you can still use 'npm run dev' if you prefer.
    command: process.env.CI ? 'npx serve -s dist -l 3000' : 'npm run dev',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // Give it 2 mins to start up in CI
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});