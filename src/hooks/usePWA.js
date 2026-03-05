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

    // Set a timeout reload as a last resort — if controllerchange never fires
    // (no waiting SW, dev quirk, etc.) we still reload after 3s.
    reloadTimerRef.current = setTimeout(() => {
      console.warn('[PWA] controllerchange did not fire in time — force reloading');
      window.location.reload();
    }, 3000);

    try {
      // Prefer the direct approach: post SKIP_WAITING to the waiting SW.
      // This is more reliable than updateServiceWorker(true) which can hang
      // indefinitely awaiting the controllerchange event.
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg?.waiting) {
        console.log('[PWA] Posting SKIP_WAITING to waiting SW');
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        // The controllerchange listener clears reloadTimerRef and reloads.
      } else {
        // No waiting SW — just reload directly.
        console.log('[PWA] No waiting SW found — reloading directly');
        clearTimeout(reloadTimerRef.current);
        reloadTimerRef.current = null;
        window.location.reload();
      }
    } catch (err) {
      console.warn('[PWA] Direct SKIP_WAITING failed, trying updateServiceWorker:', err);
      try {
        // Fire and forget — do NOT await this, it can hang forever.
        updateServiceWorker(true);
      } catch {
        // All methods exhausted — the timer will reload in 3s.
      }
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
        // Cancel the fallback timer — we're reloading now via controllerchange.
        if (reloadTimerRef.current) {
          clearTimeout(reloadTimerRef.current);
          reloadTimerRef.current = null;
        }
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
