import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [
    react()
  ],

  // 1. Development Server Settings
  server: {
    port: 3000,
    open: true,
  },

  // 2. Production Preview Settings
  preview: {
    port: 3000,
    strictPort: true,
    host: '0.0.0.0',
  },

  // 3. Build optimizations
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'vendor-framer': ['framer-motion'],
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-icons': ['lucide-react'],
        },
      },
    },
  },

  // 4. Vitest Settings
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    exclude: ['**/node_modules/**', '**/tests-e2e/**'],
  },
});

