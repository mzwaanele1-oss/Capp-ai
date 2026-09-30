import React, { useState } from 'react';
import { Download, X, HelpCircle, CheckCircle2 } from 'lucide-react';
import { CappLogo } from '../CappLogo';
import { PWAInstallGuideModal } from './PWAInstallGuideModal';

interface PWAInstallBannerProps {
  isInstallable: boolean;
  isInstalled: boolean;
  isDismissed: boolean;
  onInstall: () => Promise<boolean>;
  onDismiss: () => void;
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({
  isInstallable,
  isInstalled,
  isDismissed,
  onInstall,
  onDismiss,
}) => {
  const [installing, setInstalling] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // If already installed, hide the banner
  if (isInstalled) {
    return null;
  }

  // If dismissed and not explicitly requested, don't show the banner
  if (isDismissed && !isInstallable) {
    return null;
  }

  if (isDismissed) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      setInstalling(true);
      await onInstall();
      setInstalling(false);
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <div className="w-full bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 border-b border-neutral-800/80 px-4 py-2.5 z-30 transition-all">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <CappLogo size="sm" glowing={false} />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-white text-xs sm:text-sm">Install CAPP AI</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">Android PWA</span>
              </div>
              <p className="text-[11px] sm:text-xs text-neutral-400 truncate">
                Full-screen, standalone mobile experience
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleInstallClick}
              disabled={installing}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white hover:bg-neutral-200 text-black text-xs font-semibold shadow-sm transition active:scale-95 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isInstallable ? 'Install' : 'How to Install'}</span>
            </button>

            <button
              onClick={onDismiss}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/60 transition"
              aria-label="Dismiss install banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <PWAInstallGuideModal isOpen={showGuide} onClose={() => setShowGuide(false)} />
    </>
  );
};
