import { useState } from 'react';
import { Download, X, Layers, RefreshCw, Wifi, WifiOff } from 'lucide-react';

/**
 * PWAInstallBanner
 * Shown when the app is installable (beforeinstallprompt fired).
 * Displays at the bottom of the screen, mobile-friendly.
 */
export function PWAInstallBanner({ onInstall, onDismiss }) {
  const [installing, setInstalling] = useState(false);

  const handleInstall = async () => {
    setInstalling(true);
    try {
      await onInstall();
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-[80] p-4 pointer-events-none">
      <div
        className="pointer-events-auto max-w-sm mx-auto bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl shadow-2xl shadow-black/40 border border-slate-700 dark:border-slate-200 overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
      >
        <div className="flex items-center gap-4 p-4">
          {/* App Icon */}
          <div className="w-12 h-12 flex-shrink-0 rounded-xl bg-slate-800 dark:bg-slate-100 flex items-center justify-center">
            <Layers size={24} className="text-blue-400 dark:text-blue-600" strokeWidth={2.5} />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold leading-tight">Install TaskFlow</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Add to Home Screen for offline access
            </p>
          </div>

          <button
            onClick={onDismiss}
            className="flex-shrink-0 p-1.5 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 text-slate-400 dark:text-slate-500 transition-colors"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-4 pb-4 flex gap-2">
          <button
            onClick={handleInstall}
            disabled={installing}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-60"
          >
            {installing ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download size={16} />
            )}
            Install App
          </button>
          <button
            onClick={onDismiss}
            className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-400 dark:text-slate-500 hover:bg-slate-800 dark:hover:bg-slate-100 transition-all"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * PWAUpdateBanner
 * Shown when a new service worker version is waiting.
 */
export function PWAUpdateBanner({ onUpdate, onDismiss }) {
  return (
    <div className="fixed top-20 inset-x-0 z-[80] px-4 pointer-events-none">
      <div className="pointer-events-auto max-w-sm mx-auto bg-blue-600 text-white rounded-2xl shadow-2xl shadow-blue-900/40 overflow-hidden animate-in slide-in-from-top-4 duration-300">
        <div className="flex items-center gap-3 px-4 py-3">
          <RefreshCw size={18} className="flex-shrink-0 animate-spin" style={{ animationDuration: '3s' }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold">Update available</p>
            <p className="text-xs text-blue-200 mt-0.5">A new version of TaskFlow is ready</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={onUpdate}
              className="px-3 py-1.5 bg-white text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-50 transition-colors active:scale-95"
            >
              Update
            </button>
            <button
              onClick={onDismiss}
              className="p-1.5 hover:bg-blue-500 rounded-lg text-blue-200 transition-colors"
              aria-label="Dismiss update"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * OfflineToast
 * A slim persistent banner shown at the bottom when offline.
 */
export function OfflineToast() {
  return (
    <div className="fixed bottom-0 inset-x-0 z-[90] pointer-events-none">
      <div className="pointer-events-auto flex items-center justify-center gap-2 py-2 px-4 bg-slate-800/95 text-white text-xs font-semibold backdrop-blur-sm animate-in slide-in-from-bottom-2 duration-200">
        <WifiOff size={13} className="text-amber-400 flex-shrink-0" />
        <span>You're offline — changes will sync when reconnected</span>
      </div>
    </div>
  );
}

/**
 * OnlineToast
 * Momentary toast when connectivity is restored.
 */
export function OnlineToast() {
  return (
    <div className="fixed bottom-0 inset-x-0 z-[90] pointer-events-none">
      <div className="pointer-events-auto flex items-center justify-center gap-2 py-2 px-4 bg-emerald-600/95 text-white text-xs font-semibold backdrop-blur-sm animate-in slide-in-from-bottom-2 duration-200">
        <Wifi size={13} className="flex-shrink-0" />
        <span>Back online — syncing changes…</span>
      </div>
    </div>
  );
}
