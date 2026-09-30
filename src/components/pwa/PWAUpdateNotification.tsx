import React, { useState } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PWAUpdateNotificationProps {
  hasUpdate: boolean;
  onUpdate: () => void;
  isUserTyping?: boolean;
}

export const PWAUpdateNotification: React.FC<PWAUpdateNotificationProps> = ({
  hasUpdate,
  onUpdate,
  isUserTyping = false,
}) => {
  const [updating, setUpdating] = useState(false);

  // If user is currently typing, delay showing or avoid interrupting
  if (!hasUpdate || isUserTyping) return null;

  const handleUpdate = () => {
    setUpdating(true);
    onUpdate();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 50, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 50, opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.25 }}
        className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-full bg-neutral-900 border border-neutral-700/80 text-white text-xs sm:text-sm font-medium shadow-2xl backdrop-blur-md"
        role="alert"
      >
        <span className="p-1 rounded-full bg-sky-500/20 text-sky-400">
          <Sparkles className="w-3.5 h-3.5" />
        </span>
        <span className="text-neutral-200">A new version of CAPP AI is available.</span>
        <button
          onClick={handleUpdate}
          disabled={updating}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500 hover:bg-sky-400 text-black font-semibold text-xs transition active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${updating ? 'animate-spin' : ''}`} />
          <span>Update</span>
        </button>
      </motion.div>
    </AnimatePresence>
  );
};
