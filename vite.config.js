import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  
  // 1. Development Server Settings
  server: {
    port: 3000,
    open: true
  },

  // 2. Production Preview Settings (Used by Playwright in CI)
  preview: {
    port: 3000,
    strictPort: true,
    host: '0.0.0.0' // Ensures visibility in the GitHub Runner environment
  },

  // 3. Vitest Settings (Moved from vitest.config.js)
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    exclude: ['**/node_modules/**', '**/tests-e2e/**'], // Keeps Unit and E2E separate
  },
});