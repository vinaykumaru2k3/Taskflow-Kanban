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
    try {
      // updateServiceWorker(true) sends SKIP_WAITING to the waiting SW via the
      // virtual:pwa-register module, then reloads the page.
      await updateServiceWorker(true);
    } catch (err) {
      // Fallback: manually post SKIP_WAITING to the waiting SW registration.
      // This handles cases where the virtual module's handler isn't available
      // (e.g. dev mode with an unusual SW lifecycle).
      console.warn('[PWA] updateServiceWorker() failed, using fallback:', err);
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg?.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          // controllerchange listener will reload the page
        } else {
          // No waiting SW found; just reload to get the freshest content.
          window.location.reload();
        }
      } catch (fallbackErr) {
        console.error('[PWA] Fallback update also failed:', fallbackErr);
        window.location.reload();
      }
    }
  }, [updateServiceWorker]);

  // Allow the user to dismiss the update banner without applying the update.
  // The waiting SW stays in place and will activate on the next page load.
  const dismissUpdate = useCallback(() => {
    setHasUpdate(false);
  }, []);

  // Reload page when new service worker takes control
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      const handleControllerChange = () => {
        window.location.reload();
      };
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
      return () => {
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      };
    }
  }, []);

  return { isInstallable, promptInstall, isOnline, hasUpdate, applyUpdate, dismissUpdate };
}
