import React from 'react';
import {
  Menu,
  Plus,
  Settings,
  User,
  Wand2,
  Sparkles,
  Globe,
  Share2,
} from 'lucide-react';
import { CappLogo } from './CappLogo';
import { UserProfile } from '../types';

interface HeaderProps {
  title?: string;
  onOpenSidebar: () => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
  onOpenTools: () => void;
  onOpenImageStudio: () => void;
  onShare: () => void;
  user: UserProfile;
  webSearchActive: boolean;
  onToggleWebSearch: () => void;
  isStreaming: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onOpenSidebar,
  onNewChat,
  onOpenSettings,
  onOpenTools,
  onOpenImageStudio,
  onShare,
  user,
  webSearchActive,
  onToggleWebSearch,
  isStreaming,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-3 sm:px-4 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800/80 transition-colors">
      {/* Left: Mobile Drawer Trigger + Brand */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onOpenSidebar}
          aria-label="Toggle Navigation Menu"
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <CappLogo size="sm" showText={false} />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-white">
                CAPP AI
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-neutral-900 text-neutral-400 border border-neutral-800">
                Flash
              </span>
            </div>
            {title && (
              <span className="text-[11px] text-neutral-400 font-normal truncate max-w-[140px] sm:max-w-[240px] md:max-w-[320px]">
                {title}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Center / Right Controls */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {/* Web Search toggle */}
        <button
          onClick={onToggleWebSearch}
          title={webSearchActive ? 'Web grounding active' : 'Enable live Google search grounding'}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
            webSearchActive
              ? 'bg-neutral-100 text-neutral-950 shadow-sm shadow-white/10'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-neutral-800'
          }`}
        >
          <Globe className={`w-3.5 h-3.5 ${webSearchActive ? 'text-blue-600' : 'text-neutral-400'}`} />
          <span className="hidden sm:inline">Search</span>
        </button>

        {/* Tools Button */}
        <button
          onClick={onOpenTools}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-900 border border-neutral-800 transition-colors"
          title="Creative & Coding Tools"
        >
          <Wand2 className="w-3.5 h-3.5 text-neutral-300" />
          <span className="hidden md:inline">Tools</span>
        </button>

        {/* Image Studio Button */}
        <button
          onClick={onOpenImageStudio}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-900 border border-neutral-800 transition-colors"
          title="Image Studio"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span className="hidden md:inline">Studio</span>
        </button>

        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          disabled={isStreaming}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-neutral-100 border border-neutral-700/60 shadow-xs transition-colors disabled:opacity-50"
          title="Start a new conversation"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Chat</span>
        </button>

        {/* Share Button */}
        <button
          onClick={onShare}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
          title="Share conversation"
        >
          <Share2 className="w-4 h-4" />
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
          title="Settings & Memory"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Profile Avatar / Trigger */}
        <button
          onClick={onOpenSettings}
          className="flex items-center justify-center w-7 h-7 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-300 hover:border-neutral-500 transition-all text-xs font-bold"
          title={user.name}
        >
          {user.name.charAt(0).toUpperCase()}
        </button>
      </div>
    </header>
  );
};
