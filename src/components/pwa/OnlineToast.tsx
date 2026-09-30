import React from 'react';
import { Wifi } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OnlineToastProps {
  show: boolean;
}

export const OnlineToast: React.FC<OnlineToastProps> = ({ show }) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 20, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 text-xs sm:text-sm font-medium shadow-xl backdrop-blur-md"
          role="status"
          aria-live="polite"
        >
          <span className="p-1 rounded-full bg-emerald-500/20 text-emerald-400">
            <Wifi className="w-3.5 h-3.5" />
          </span>
          <span>You're back online.</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
