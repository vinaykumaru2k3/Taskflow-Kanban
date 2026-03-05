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
      if (r && !updateIntervalRef.current) {
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
    // With registerType: 'prompt', this triggers SKIP_WAITING and resolves once the new SW is activated.
    console.log('[PWA] User accepted update; activating new Service Worker...');
    try {
      await updateServiceWorker(true);
      // controllerchange listener below will reload once the new SW takes control.
      setHasUpdate(false);
    } catch (err) {
      console.error('[PWA] Failed to apply update:', err);
    }
  }, [updateServiceWorker]);

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

  return { isInstallable, promptInstall, isOnline, hasUpdate, applyUpdate };
}
