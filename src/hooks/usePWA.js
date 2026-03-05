import { useState, useEffect, useCallback, useRef } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * usePWA — manages install prompt, SW updates, and online/offline state.
 *
 * vite-plugin-pwa registers 'virtual:pwa-register/react' in both dev and
 * production, so this import always resolves correctly.
 */

export function usePWA() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const updateIntervalRef = useRef();

  const [hasUpdate, setHasUpdate] = useState(false);

  const { updateServiceWorker } = useRegisterSW({
    // When a new SW is installed and waiting, show an update banner.
    onNeedRefresh() {
      console.log('[PWA] Update available (waiting SW).');
      setHasUpdate(true);
    },
    onOfflineReady() {
      console.log('[PWA] App ready to work offline.');
    },
    onRegistered(r) {
      console.log('[PWA] Service Worker registered:', r);
      // Clear any existing interval before setting a new one
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
      if (r) {
        updateIntervalRef.current = setInterval(() => r.update(), 5 * 60 * 1000);
      }
    },
    onRegisterError(err) {
      console.warn('[PWA] SW registration error:', err);
    },
  });

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, []);

  // ── Install prompt ─────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setIsInstallable(true);
    };
    const installedHandler = () => {
      setIsInstallable(false);
      setInstallPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installedHandler);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  // ── Online / Offline ───────────────────────────────────────────────────
  useEffect(() => {
    const goOnline  = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online',  goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online',  goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────
  const promptInstall = useCallback(async () => {
    if (!installPrompt) return false;
    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstallable(false);
        setInstallPrompt(null);
      }
      return outcome === 'accepted';
    } catch (err) {
      console.error('[PWA] Error during installation prompt:', err);
      return false;
    }
  }, [installPrompt]);

  const applyUpdate = useCallback(async () => {
    console.log('[PWA] User accepted update; activating new Service Worker...');
    setHasUpdate(false);

    // [Robustness] Force a reload after 3s as a fail-safe.
    // We use a timestamped URL to bypass HTTP cache on index.html.
    const forceReload = () => {
      console.warn('[PWA] Update took too long — force reloading with cache-bust');
      const url = new URL(window.location.href);
      url.searchParams.set('v', Date.now());
      window.location.assign(url.href);
    };

    reloadTimerRef.current = setTimeout(forceReload, 3000);

    try {
      // 1. Target the waiting Service Worker directly
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg?.waiting) {
        console.log('[PWA] Posting SKIP_WAITING to waiting SW');
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      } else {
        // Fallback to the library-provided update method
        console.log('[PWA] No waiting SW found via API, falling back to updateServiceWorker');
        updateServiceWorker(true);
      }

      // 2. Attempt to clear caches for a truly fresh start
      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names.map(n => caches.delete(n)));
        console.log('[PWA] Local caches cleared');
      }
    } catch (err) {
      console.warn('[PWA] Update logic encountered an error:', err);
      // Fallback timer will handle it
    }
  }, [updateServiceWorker]);

  // Allow the user to dismiss the update banner without applying the update.
  // The waiting SW stays in place and will activate on the next page load.
  const dismissUpdate = useCallback(() => {
    setHasUpdate(false);
  }, []);

  // Ref to hold the fallback reload timer set in applyUpdate.
  // The controllerchange listener clears it so we don't double-reload.
  const reloadTimerRef = useRef(null);

  // Reload page when new service worker takes control
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      const handleControllerChange = () => {
        // Cancel the fallback timer — we're about to reload.
        if (reloadTimerRef.current) {
          clearTimeout(reloadTimerRef.current);
          reloadTimerRef.current = null;
        }
        
        console.log('[PWA] Controller changed — reloading with cache-bust');
        const url = new URL(window.location.href);
        url.searchParams.set('v', Date.now());
        window.location.assign(url.href);
      };
      
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
      return () => {
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      };
    }
  }, []);

  return { isInstallable, promptInstall, isOnline, hasUpdate, applyUpdate, dismissUpdate };
}
