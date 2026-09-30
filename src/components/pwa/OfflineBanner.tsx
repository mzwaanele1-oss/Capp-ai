import React, { useState } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OfflineBannerProps {
  isOnline: boolean;
  onRetry?: () => void;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ isOnline, onRetry }) => {
  const [retrying, setRetrying] = useState(false);

  if (isOnline) return null;

  const handleRetry = async () => {
    setRetrying(true);
    if (onRetry) {
      onRetry();
    } else {
      // Test connectivity by pinging health endpoint
      try {
        await fetch('/api/health', { cache: 'no-store' });
        window.location.reload();
      } catch (_) {}
    }
    setTimeout(() => setRetrying(false), 800);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full bg-neutral-900/95 border-b border-amber-500/30 px-4 py-2.5 backdrop-blur-md z-40 text-amber-200"
        role="alert"
        aria-live="assertive"
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-1 rounded-md bg-amber-500/20 text-amber-400 shrink-0">
              <WifiOff className="w-4 h-4" />
            </span>
            <div className="truncate text-xs sm:text-sm">
              <span className="font-semibold text-white mr-1.5">CAPP AI is offline.</span>
              <span className="text-neutral-400 hidden sm:inline">
                AI responses require an active internet connection.
              </span>
            </div>
          </div>

          <button
            onClick={handleRetry}
            disabled={retrying}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-medium border border-amber-500/30 transition shrink-0 active:scale-95 disabled:opacity-50"
            aria-label="Retry connection"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} />
            <span>Retry</span>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
