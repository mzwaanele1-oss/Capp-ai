import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CappLogo } from '../CappLogo';

interface StartupSplashProps {
  onComplete?: () => void;
}

export const StartupSplash: React.FC<StartupSplashProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Quick, smooth native Android splash timing: 1.3 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, 1300);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          onClick={() => {
            setIsVisible(false);
            onComplete?.();
          }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-black text-white px-6 py-12 select-none cursor-pointer"
          style={{ paddingTop: 'env(safe-area-inset-top, 24px)', paddingBottom: 'env(safe-area-inset-bottom, 32px)' }}
          role="dialog"
          aria-label="CAPP AI Startup"
        >
          {/* Subtle ambient background glow */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
            <div className="w-80 h-80 rounded-full bg-gradient-to-tr from-sky-500/10 via-indigo-500/10 to-transparent blur-3xl opacity-60" />
          </div>

          <div className="w-full flex justify-end">
            <span className="text-[11px] font-mono tracking-widest text-neutral-500 uppercase">v1.0.0</span>
          </div>

          {/* Centered Identity */}
          <div className="flex flex-col items-center text-center relative z-10">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative mb-6"
            >
              <div className="absolute -inset-3 rounded-3xl bg-sky-500/20 blur-xl animate-pulse" />
              <CappLogo size="xl" glowing={true} />
            </motion.div>

            <motion.div
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.45 }}
              className="flex items-center gap-2 mb-2"
            >
              <span className="text-3xl font-extrabold tracking-tight text-white font-sans">CAPP</span>
              <span className="text-3xl font-light tracking-widest text-neutral-400">AI</span>
            </motion.div>

            <motion.p
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.45 }}
              className="text-xs sm:text-sm font-medium text-neutral-400 tracking-wide"
            >
              Think smarter. Create more.
            </motion.p>
          </div>

          {/* Bottom subtle progress / Android indicator */}
          <div className="w-full max-w-[200px] flex flex-col items-center gap-3 relative z-10">
            <div className="w-full h-1 bg-neutral-900 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.2, ease: 'easeInOut' }}
                className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full"
              />
            </div>
            <span className="text-[11px] text-neutral-600 font-medium">Ready</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
