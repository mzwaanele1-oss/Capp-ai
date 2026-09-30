import React, { useState } from 'react';
import {
  Plus,
  Search,
  MessageSquare,
  Pin,
  PinOff,
  MoreVertical,
  Trash2,
  Edit2,
  Check,
  X,
  Settings,
  Wand2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Database,
  Info,
  Download,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';
import { Conversation, UserProfile } from '../types';
import { CappLogo } from './CappLogo';
import { useAndroidBackNavigation } from '../hooks/useAndroidBackNavigation';

interface SidebarProps {
  conversations: Conversation[];
  currentId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onTogglePinConversation: (id: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsedDesktop: boolean;
  onToggleCollapseDesktop: () => void;
  onOpenSettings: (tab?: string) => void;
  onOpenTools: () => void;
  onOpenImageStudio: () => void;
  user: UserProfile;
  isInstallable?: boolean;
  isInstalled?: boolean;
  onInstall?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  currentId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  onTogglePinConversation,
  isOpenMobile,
  onCloseMobile,
  isCollapsedDesktop,
  onToggleCollapseDesktop,
  onOpenSettings,
  onOpenTools,
  onOpenImageStudio,
  user,
  isInstallable = false,
  isInstalled = false,
  onInstall,
}) => {
  // Support Android Back navigation to close mobile drawer
  useAndroidBackNavigation(isOpenMobile, onCloseMobile);

  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  // Filter conversations
  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedConversations = filteredConversations.filter((c) => c.isPinned);
  const recentConversations = filteredConversations.filter((c) => !c.isPinned);

  const handleStartRename = (convo: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(convo.id);
    setEditTitle(convo.title);
    setMenuOpenId(null);
  };

  const handleSaveRename = (id: string, e: React.MouseEvent | React.FormEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const renderConvoItem = (convo: Conversation) => {
    const isActive = convo.id === currentId;
    const isEditing = convo.id === editingId;

    return (
      <div
        key={convo.id}
        onClick={() => {
          onSelectConversation(convo.id);
          onCloseMobile();
        }}
        className={`group relative flex items-center justify-between px-2.5 py-2 rounded-xl text-xs sm:text-sm cursor-pointer transition-all ${
          isActive
            ? 'bg-neutral-800 text-white font-medium shadow-xs'
            : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/80'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-neutral-500'}`} />

          {isEditing ? (
            <form
              onSubmit={(e) => handleSaveRename(convo.id, e)}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 w-full"
            >
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                autoFocus
                className="w-full bg-neutral-950 border border-neutral-700 rounded px-1.5 py-0.5 text-xs text-white focus:outline-hidden focus:border-neutral-400"
              />
              <button
                type="button"
                onClick={(e) => handleSaveRename(convo.id, e)}
                className="p-1 hover:text-emerald-400"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleCancelRename}
                className="p-1 hover:text-neutral-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <span className="truncate">{convo.title || 'Untitled Conversation'}</span>
          )}
        </div>

        {/* Action button trigger */}
        {!isEditing && (
          <div className="relative shrink-0 flex items-center">
            {convo.isPinned && (
              <Pin className="w-3 h-3 text-neutral-400 group-hover:hidden mr-1" />
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpenId(menuOpenId === convo.id ? null : convo.id);
              }}
              className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-neutral-700/60 text-neutral-400 hover:text-white transition-opacity"
              title="More options"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {/* Context dropdown menu */}
            {menuOpenId === convo.id && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpenId(null);
                  }}
                />
                <div
                  className="absolute right-0 top-7 z-50 w-36 rounded-xl bg-neutral-900 border border-neutral-750 shadow-xl py-1 text-xs text-neutral-300"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => {
                      onTogglePinConversation(convo.id);
                      setMenuOpenId(null);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-neutral-800 text-left transition-colors"
                  >
                    {convo.isPinned ? (
                      <>
                        <PinOff className="w-3.5 h-3.5" />
                        <span>Unpin</span>
                      </>
                    ) : (
                      <>
                        <Pin className="w-3.5 h-3.5" />
                        <span>Pin to top</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={(e) => handleStartRename(convo, e)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-neutral-800 text-left transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Rename</span>
                  </button>
                  <div className="my-1 border-t border-neutral-800" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteConversation(convo.id);
                      setMenuOpenId(null);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-red-500/10 text-red-400 text-left transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-neutral-950 border-r border-neutral-850 select-none">
      {/* Top Header */}
      <div className="p-3.5 flex items-center justify-between border-b border-neutral-850">
        <CappLogo size="sm" showText={true} animated={true} />
        <div className="flex items-center gap-1">
          {/* Desktop collapse button */}
          <button
            onClick={onToggleCollapseDesktop}
            className="hidden md:flex p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
            title="Collapse sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {/* Mobile close button */}
          <button
            onClick={onCloseMobile}
            className="flex md:hidden p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* New Chat & Search */}
      <div className="p-3 space-y-2.5">
        <button
          onClick={() => {
            onNewChat();
            onCloseMobile();
          }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-neutral-100 text-neutral-950 hover:bg-white shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Chat</span>
        </button>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-900/90 text-neutral-200 placeholder-neutral-500 text-xs rounded-xl pl-8 pr-3 py-1.5 border border-neutral-800 focus:outline-hidden focus:border-neutral-600 transition-colors"
          />
        </div>
      </div>

      {/* Feature shortcuts */}
      <div className="px-3 py-1 grid grid-cols-2 gap-1.5 text-xs">
        <button
          onClick={() => {
            onOpenTools();
            onCloseMobile();
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-900/60 hover:bg-neutral-850 text-neutral-300 border border-neutral-800 transition-colors"
        >
          <Wand2 className="w-3.5 h-3.5 text-neutral-300" />
          <span className="truncate">AI Tools</span>
        </button>
        <button
          onClick={() => {
            onOpenImageStudio();
            onCloseMobile();
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-900/60 hover:bg-neutral-850 text-neutral-300 border border-neutral-800 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span className="truncate">Image Studio</span>
        </button>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-3">
        {/* Pinned section */}
        {pinnedConversations.length > 0 && (
          <div>
            <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
              Pinned
            </div>
            <div className="space-y-0.5">{pinnedConversations.map(renderConvoItem)}</div>
          </div>
        )}

        {/* Recent section */}
        <div>
          <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            Recent
          </div>
          {recentConversations.length === 0 && pinnedConversations.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-neutral-500">
              {searchQuery ? 'No matching conversations' : 'No conversations yet'}
            </div>
          ) : (
            <div className="space-y-0.5">{recentConversations.map(renderConvoItem)}</div>
          )}
        </div>
      </div>

      {/* Bottom Profile, About, & PWA Install */}
      <div className="p-3 border-t border-neutral-850 space-y-1">
        {/* PWA Install Button or Standalone Status */}
        {!isInstalled && onInstall && (
          <button
            onClick={() => {
              onInstall();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-sky-400 border border-sky-500/20 transition-all active:scale-98"
          >
            <div className="flex items-center gap-2">
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>Install CAPP AI</span>
            </div>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300">PWA</span>
          </button>
        )}

        {isInstalled && (
          <div className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-neutral-900/40 text-[11px] text-neutral-400">
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>Standalone Android App</span>
            <CheckCircle2 className="w-3 h-3 text-emerald-400 ml-auto" />
          </div>
        )}

        {/* About CAPP AI button */}
        <button
          onClick={() => {
            onOpenSettings('about');
            onCloseMobile();
          }}
          className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-neutral-400" />
            <span>About CAPP AI</span>
          </div>
          <span className="text-[10px] font-mono text-neutral-500">v1.0.0</span>
        </button>

        {/* Export Source Code (.ZIP) */}
        <a
          href="/capp-source-code.zip"
          download="capp-source-code.zip"
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
          title="Download complete project source code archive"
        >
          <div className="flex items-center gap-2">
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>Export Source Code</span>
          </div>
          <span className="text-[10px] font-mono text-neutral-500">.ZIP</span>
        </a>

        {/* User Profile & Settings */}
        <button
          onClick={() => {
            onOpenSettings();
            onCloseMobile();
          }}
          className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white text-xs font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="text-left">
              <div className="font-medium text-neutral-200 truncate max-w-[120px]">
                {user.name}
              </div>
              <div className="text-[10px] text-neutral-500">Settings & Memory</div>
            </div>
          </div>
          <Settings className="w-4 h-4 text-neutral-400" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 transition-transform duration-300 ease-in-out md:hidden ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </div>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:block transition-all duration-300 ease-in-out shrink-0 relative ${
          isCollapsedDesktop ? 'w-0 overflow-hidden border-none' : 'w-64 lg:w-72'
        }`}
      >
        {!isCollapsedDesktop && sidebarContent}
      </aside>

      {/* Desktop Expand Icon if collapsed */}
      {isCollapsedDesktop && (
        <button
          onClick={onToggleCollapseDesktop}
          className="fixed left-3 bottom-3 z-30 hidden md:flex items-center justify-center p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 shadow-md transition-all"
          title="Open sidebar"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </>
  );
};
