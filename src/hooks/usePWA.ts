import { useState, useEffect, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [showOnlineToast, setShowOnlineToast] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  // Check standalone mode (PWA installed and launched from home screen)
  useEffect(() => {
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      (window.navigator as any).standalone === true;

    setIsInstalled(isStandaloneMode);

    // Check if user previously dismissed install prompt
    const dismissed = localStorage.getItem('capp_ai_pwa_dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  // Listen to beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      localStorage.removeItem('capp_ai_pwa_dismissed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Monitor network connectivity changes
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleOnline = () => {
      setIsOnline(true);
      setShowOnlineToast(true);
      timeoutId = setTimeout(() => {
        setShowOnlineToast(false);
      }, 4000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOnlineToast(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTimeout(timeoutId);
    };
  }, []);

  // Register Service Worker and monitor updates
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV !== 'test') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          // If a new worker is already waiting
          if (reg.waiting) {
            setWaitingWorker(reg.waiting);
            setHasUpdate(true);
          }

          // Check on updatefound
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setWaitingWorker(newWorker);
                  setHasUpdate(true);
                }
              });
            }
          });
        })
        .catch((err) => {
          console.warn('Service worker registration error:', err);
        });

      // Handle controllerchange (safe refresh on user prompt)
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  }, []);

  // Trigger browser install prompt
  const installApp = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      return false;
    }
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
        setDeferredPrompt(null);
        return true;
      }
    } catch (err) {
      console.warn('Installation error:', err);
    }
    return false;
  }, [deferredPrompt]);

  // Dismiss in-app install prompt banner
  const dismissInstallPrompt = useCallback(() => {
    setIsDismissed(true);
    localStorage.setItem('capp_ai_pwa_dismissed', 'true');
  }, []);

  // Trigger service worker update
  const updateApp = useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  }, [waitingWorker]);

  return {
    isInstallable,
    isInstalled,
    isOnline,
    showOnlineToast,
    hasUpdate,
    isDismissed,
    installApp,
    dismissInstallPrompt,
    updateApp,
  };
}
