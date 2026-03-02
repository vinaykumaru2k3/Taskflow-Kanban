import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  // 1. Development Server Settings
  server: {
    port: 3000,
    open: true,
  },

  // 2. Production Preview Settings (Used by Playwright in CI)
  preview: {
    port: 3000,
    strictPort: true,
    host: '0.0.0.0',
  },

  // 3. Build optimizations
  build: {
    // [perf] Enable code splitting for better initial load performance
    target: 'es2020',
    // [perf] Increase warning threshold slightly – large chunks are expected with Firebase
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // [perf] Manually chunk heavy vendor libs to benefit from long-term caching
        manualChunks: {
          // Firebase is very large – isolate it so app code changes don't bust its cache
          'vendor-firebase': [
            'firebase/app',
            'firebase/auth',
            'firebase/firestore',
          ],
          // Framer Motion is only used on the Landing page
          'vendor-framer': ['framer-motion'],
          // React core
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Icons
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