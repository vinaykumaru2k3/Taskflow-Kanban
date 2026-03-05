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

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('[PWA] Service Worker registered:', r);
      if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);
      if (r) updateIntervalRef.current = setInterval(() => r.update(), 5 * 60 * 1000);
    },
    onRegisterError(err) {
      console.warn('[PWA] SW registration error:', err);
    },
  });

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
    
    // Immediately hide the banner by updating the internal state
    setNeedRefresh(false);

    // [Robustness] Cache-busting reload target
    const getUpdateUrl = () => {
      const url = new URL(window.location.href);
      url.searchParams.set('v', Date.now());
      return url.href;
    };

    // Fail-safe: Reload if SW activation hangs
    const timer = setTimeout(() => {
      console.warn('[PWA] Update timeout — force reloading');
      window.location.assign(getUpdateUrl());
    }, 4000);

    try {
      // 1. Clear local caches before reload for a truly fresh start
      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names.map(n => caches.delete(n)));
        console.log('[PWA] Local caches cleared');
      }
      
      // 2. Trigger the SKIP_WAITING and Controller Change
      // This is the most reliable way as it handles the cross-tab messaging internally
      updateServiceWorker(true);
    } catch (err) {
      console.error('[PWA] Update failed:', err);
    }
    
    // The controllerchange listener below will handle the actual reload.
  }, [updateServiceWorker, setNeedRefresh]);

  const dismissUpdate = useCallback(() => {
    setNeedRefresh(false);
  }, [setNeedRefresh]);

  // Handle automatic reload across all tabs when the SW activates
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      const handleControllerChange = () => {
        console.log('[PWA] Service Worker activated — reloading page');
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

  return { isInstallable, promptInstall, isOnline, hasUpdate: needRefresh, applyUpdate, dismissUpdate };
}
