import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),

    // ── PWA / Service Worker ──────────────────────────────────────────────
    VitePWA({
      // registerType: 'prompt' — new SWs stay in the "waiting" state until
      // the user explicitly clicks Update. This is required for onNeedRefresh
      // (and the update banner) to ever fire. 'autoUpdate' would skip waiting
      // automatically and the banner would never appear.
      registerType: 'prompt',
      devOptions: {
        // Enable the virtual:pwa-register module in dev so the hook resolves.
        // Without this, useRegisterSW() throws in development.
        enabled: true,
        type: 'module',
      },
      // NOTE: Do NOT set srcDir + filename here.
      // Those props switch the plugin to 'injectManifest' mode, where the
      // workbox config block below is completely ignored (including skipWaiting).
      // We need 'generateSW' mode so that skipWaiting: false is applied.
      includeAssets: ['favicon.png', 'icons/*.svg'],
      manifest: {
        name: 'TaskFlow - Kanban Board',
        short_name: 'TaskFlow',
        description: 'Modern Kanban board for high-performance teams.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#0f172a',
        theme_color: '#0f172a',
        categories: ['productivity', 'utilities'],
        icons: [
          {
            src: '/icons/icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
          {
            src: '/favicon.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
        ],
        shortcuts: [
          {
            name: 'New Task',
            short_name: 'Add Task',
            url: '/?action=new-task',
            icons: [{ src: '/icons/icon-192.svg', sizes: '192x192' }],
          },
        ],
      },
      workbox: {
        // skipWaiting: false is CRITICAL.
        // When true (Workbox default), the SW calls skipWaiting() on install,
        // which bypasses the waiting phase and prevents onNeedRefresh from firing.
        // Setting it to false makes the new SW wait for an explicit SKIP_WAITING
        // message — sent by updateServiceWorker(true) when user clicks Update.
        skipWaiting: false,
        // clientsClaim: true makes the SW take control of all open tabs once
        // it activates. Combined with skipWaiting: false this means:
        //   - New SW waits (update banner shows)
        //   - User clicks Update → SKIP_WAITING sent → SW activates
        //   - SW claims all clients → page reloads with new version
        clientsClaim: true,

        // Precache static assets produced by Vite.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Don't precache Firebase SDK chunks (they're huge and versioned)
        globIgnores: ['**/firebase*', '**/chunk-*firebase*', '**/firebase-*.js', '**/firebase-*.mjs'],

        // Avoid serving stale index.html; rely on network for navigations (fallback to cache if offline).
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],

        // Enable maximum precache update delay for faster updates
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,

        runtimeCaching: [
          // Google Fonts — CacheFirst, long TTL
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Avatar images (pravatar) — StaleWhileRevalidate
          {
            urlPattern: /^https:\/\/i\.pravatar\.cc\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'avatar-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Firebase Firestore / Auth — NetworkFirst so realtime data stays fresh
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firestore-cache',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Firebase Auth
          {
            urlPattern: /^https:\/\/www\.googleapis\.com\/identitytoolkit\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firebase-auth-cache',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 5 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
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

