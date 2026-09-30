import React from 'react';
import { Sparkles, MessageSquare, ArrowRight, Wand2, ShieldCheck } from 'lucide-react';
import { CappLogo } from './CappLogo';

interface WelcomeModalProps {
  isOpen: boolean;
  onStartChatting: () => void;
  onExplore: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  isOpen,
  onStartChatting,
  onExplore,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl p-7 text-center text-neutral-100 flex flex-col items-center">
        {/* Ambient glow */}
        <div className="absolute top-0 inset-x-0 h-32 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-500/20 via-transparent to-transparent pointer-events-none" />

        {/* CAPP Logo */}
        <div className="mb-4">
          <CappLogo size="xl" animated={true} />
        </div>

        {/* Title */}
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">CAPP</h1>
          <span className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
            AI
          </span>
        </div>

        {/* Subtitle */}
        <h2 className="text-base font-semibold text-neutral-300 mt-2">
          Your intelligent AI companion.
        </h2>

        {/* Description */}
        <p className="text-xs sm:text-sm text-neutral-400 mt-2 max-w-sm leading-relaxed">
          Ask questions. Create ideas. Solve problems. Learn something new.
        </p>

        {/* Feature Highlights */}
        <div className="grid grid-cols-3 gap-2 w-full mt-6 text-left">
          <div className="p-3 rounded-2xl bg-neutral-950/70 border border-neutral-800/80">
            <Sparkles className="w-4 h-4 text-amber-400 mb-1.5" />
            <div className="font-semibold text-[11px] text-neutral-200">Multimodal</div>
            <div className="text-[10px] text-neutral-500">Images & files</div>
          </div>
          <div className="p-3 rounded-2xl bg-neutral-950/70 border border-neutral-800/80">
            <Wand2 className="w-4 h-4 text-purple-400 mb-1.5" />
            <div className="font-semibold text-[11px] text-neutral-200">Studio Tools</div>
            <div className="text-[10px] text-neutral-500">Writing & code</div>
          </div>
          <div className="p-3 rounded-2xl bg-neutral-950/70 border border-neutral-800/80">
            <ShieldCheck className="w-4 h-4 text-emerald-400 mb-1.5" />
            <div className="font-semibold text-[11px] text-neutral-200">Private Memory</div>
            <div className="text-[10px] text-neutral-500">Secure context</div>
          </div>
        </div>

        {/* Actions */}
        <div className="w-full space-y-2 mt-6">
          <button
            onClick={onStartChatting}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white hover:bg-neutral-200 text-neutral-950 font-bold text-sm shadow-lg transition-all"
          >
            <span>Start chatting</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onExplore}
            className="w-full py-2.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 hover:text-white font-medium text-xs border border-neutral-750 transition-colors"
          >
            Explore CAPP AI
          </button>
        </div>
      </div>
    </div>
  );
};
