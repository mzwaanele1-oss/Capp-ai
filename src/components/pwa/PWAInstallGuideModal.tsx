import React from 'react';
import { X, Smartphone, MoreVertical, PlusSquare, ArrowUpRight } from 'lucide-react';
import { CappLogo } from '../CappLogo';

interface PWAInstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallGuideModal: React.FC<PWAInstallGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm rounded-2xl bg-neutral-900 border border-neutral-800 p-6 text-neutral-100 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <CappLogo size="sm" />
          <div>
            <h3 className="text-base font-bold text-white">Install CAPP AI</h3>
            <p className="text-xs text-neutral-400">Add to your Android home screen</p>
          </div>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-neutral-300 py-2">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
            <span className="p-2 rounded-lg bg-neutral-800 text-sky-400 shrink-0">
              <MoreVertical className="w-4 h-4" />
            </span>
            <div>
              <p className="font-semibold text-white">1. Open browser menu</p>
              <p className="text-neutral-400 text-xs mt-0.5">
                Tap the three dots (⋮) in the top-right or bottom toolbar of your browser.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
            <span className="p-2 rounded-lg bg-neutral-800 text-sky-400 shrink-0">
              <PlusSquare className="w-4 h-4" />
            </span>
            <div>
              <p className="font-semibold text-white">2. Select Install or Add</p>
              <p className="text-neutral-400 text-xs mt-0.5">
                Choose <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
            <span className="p-2 rounded-lg bg-neutral-800 text-emerald-400 shrink-0">
              <Smartphone className="w-4 h-4" />
            </span>
            <div>
              <p className="font-semibold text-white">3. Launch Standalone</p>
              <p className="text-neutral-400 text-xs mt-0.5">
                Open CAPP AI directly from your phone's home screen or app drawer with zero browser bars!
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs sm:text-sm transition active:scale-98"
        >
          Got it
        </button>
      </div>
    </div>
  );
};
