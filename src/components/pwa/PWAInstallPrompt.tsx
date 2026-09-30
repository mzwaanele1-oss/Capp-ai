import React, { useState, useEffect } from 'react';
import { Download, X, Sparkles, Smartphone, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CappLogo } from '../CappLogo';

const LOCAL_STORAGE_KEY = 'capp_pwa_install_dismissed';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  useEffect(() => {
    // Check if user already dismissed or installed
    const isDismissed = localStorage.getItem(LOCAL_STORAGE_KEY) === 'true';
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      (window.navigator as any).standalone === true;

    if (isDismissed || isStandalone) {
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent browser default mini-infobar
      e.preventDefault();
      // Store event for triggering later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    const handleAppInstalled = () => {
      setIsVisible(false);
      setDeferredPrompt(null);
      localStorage.setItem(LOCAL_STORAGE_KEY, 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    setIsInstalling(true);
    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;

      if (choiceResult.outcome === 'accepted') {
        setInstalledSuccess(true);
        setTimeout(() => {
          setIsVisible(false);
          setDeferredPrompt(null);
          localStorage.setItem(LOCAL_STORAGE_KEY, 'true');
        }, 1500);
      } else {
        // User dismissed the browser prompt
        handleDismiss();
      }
    } catch (err) {
      console.error('PWA installation error:', err);
      handleDismiss();
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(LOCAL_STORAGE_KEY, 'true');
  };

  // Only render if browser fired beforeinstallprompt and it wasn't dismissed
  if (!isVisible || !deferredPrompt) {
    return null;
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-x-0 bottom-0 z-50 pointer-events-none p-3 sm:p-5 flex justify-center">
        <motion.div
          initial={{ y: 100, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 100, opacity: 0, scale: 0.96 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="pointer-events-auto w-full max-w-lg bg-neutral-900/95 border border-neutral-750 shadow-2xl backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-neutral-100 ring-1 ring-white/10"
          style={{
            paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
          }}
          role="dialog"
          aria-labelledby="pwa-install-title"
          aria-describedby="pwa-install-desc"
        >
          {/* Mobile swipe/sheet drag pill */}
          <div className="w-10 h-1 bg-neutral-700/80 rounded-full mx-auto mb-3 sm:hidden" />

          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="relative shrink-0 mt-0.5">
                <CappLogo size="md" glowing={true} />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-neutral-900 flex items-center justify-center">
                  <Smartphone className="w-2.5 h-2.5 text-neutral-950" />
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 id="pwa-install-title" className="font-semibold text-sm sm:text-base text-white tracking-tight">
                    Install CAPP AI
                  </h3>
                  <span className="text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Android & PWA
                  </span>
                </div>
                <p id="pwa-install-desc" className="text-xs sm:text-sm text-neutral-400 mt-1 leading-relaxed">
                  Add to your home screen for instantaneous loading, hands-free voice input, and an immersive full-screen experience.
                </p>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="shrink-0 p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              aria-label="Dismiss installation prompt"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-3 gap-2 my-3.5 pt-3 border-t border-neutral-800/80 text-[11px] text-neutral-300">
            <div className="flex items-center gap-1.5 truncate">
              <Sparkles className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="truncate">Instant Access</span>
            </div>
            <div className="flex items-center gap-1.5 truncate">
              <Smartphone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">Voice Dictation</span>
            </div>
            <div className="flex items-center gap-1.5 truncate">
              <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="truncate">Offline Capable</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 mt-2">
            <button
              type="button"
              onClick={handleDismiss}
              className="flex-1 py-2.5 px-3.5 rounded-xl text-xs sm:text-sm font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 border border-neutral-800 transition-colors text-center"
            >
              Not now
            </button>

            <button
              type="button"
              onClick={handleInstallClick}
              disabled={isInstalling || installedSuccess}
              className="flex-[2] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold bg-white hover:bg-neutral-200 text-neutral-950 transition-all active:scale-[0.98] shadow-md disabled:opacity-50"
            >
              {installedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Installed!</span>
                </>
              ) : isInstalling ? (
                <>
                  <div className="w-4 h-4 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
                  <span>Installing...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Install App</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
