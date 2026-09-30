import React, { useState } from 'react';
import {
  X,
  Sliders,
  Brain,
  Shield,
  User,
  Info,
  Trash2,
  Plus,
  Download,
  Moon,
  Sun,
  Laptop,
  Check,
  Sparkles,
  Volume2,
  VolumeX,
  BarChart3,
} from 'lucide-react';
import { AppSettings, MemoryItem, UserProfile, ResponseStyle, ThemeMode, Conversation } from '../types';
import { CappLogo } from './CappLogo';
import { useAndroidBackNavigation } from '../hooks/useAndroidBackNavigation';
import { useSpeechSynthesisVoices } from '../hooks/useTextToSpeech';
import { UsageStatisticsView } from './UsageStatisticsView';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  memories: MemoryItem[];
  onAddMemory: (text: string) => void;
  onDeleteMemory: (id: string) => void;
  onClearMemories: () => void;
  user: UserProfile;
  onSaveUser: (user: UserProfile) => void;
  onClearAllConversations: () => void;
  onExportData: () => void;
  conversations?: Conversation[];
  initialTab?: 'general' | 'model' | 'usage' | 'memory' | 'privacy' | 'account' | 'about';
}

type TabType = 'general' | 'model' | 'usage' | 'memory' | 'privacy' | 'account' | 'about';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  memories,
  onAddMemory,
  onDeleteMemory,
  onClearMemories,
  user,
  onSaveUser,
  onClearAllConversations,
  onExportData,
  conversations = [],
  initialTab = 'general',
}) => {
  // Support Android Back navigation to close modal
  useAndroidBackNavigation(isOpen, onClose);

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [newMemoryText, setNewMemoryText] = useState('');
  const [userName, setUserName] = useState(user.name);
  const [userEmail, setUserEmail] = useState(user.email);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  // Available Speech Synthesis Voices
  const { voices, isSupported: ttsSupported } = useSpeechSynthesisVoices();

  // Cancel any TTS preview audio when closing modal
  React.useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isOpen]);

  // Sync initialTab when modal opens
  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  if (!isOpen) return null;

  const handleThemeChange = (theme: ThemeMode) => {
    onSaveSettings({ ...settings, theme });
  };

  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSaveSettings({ ...settings, ttsVoice: e.target.value });
  };

  const handleTestVoice = (voiceURI: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isPlayingPreview) {
      window.speechSynthesis.cancel();
      setIsPlayingPreview(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance('Hello! This is CAPP AI reading responses aloud.');
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    if (voiceURI) {
      const match = voices.find((v) => v.voiceURI === voiceURI || v.name === voiceURI);
      if (match) utterance.voice = match;
    }

    utterance.onend = () => setIsPlayingPreview(false);
    utterance.onerror = () => setIsPlayingPreview(false);

    setIsPlayingPreview(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleResponseStyleChange = (responseStyle: ResponseStyle) => {
    onSaveSettings({ ...settings, responseStyle });
  };

  const handleToggleStreaming = () => {
    onSaveSettings({ ...settings, enableStreaming: !settings.enableStreaming });
  };

  const handleToggleMemory = () => {
    onSaveSettings({ ...settings, enableMemory: !settings.enableMemory });
  };

  const handleTemperatureChange = (val: number) => {
    onSaveSettings({ ...settings, temperature: val });
  };

  const handleAddMemorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMemoryText.trim()) {
      onAddMemory(newMemoryText.trim());
      setNewMemoryText('');
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveUser({
      ...user,
      name: userName.trim() || 'User',
      email: userEmail.trim() || 'user@example.com',
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl h-[85vh] max-h-[640px] flex flex-col md:flex-row rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden text-neutral-100">
        {/* Left Navigation Bar */}
        <div className="w-full md:w-56 shrink-0 bg-neutral-950 p-4 border-b md:border-b-0 md:border-r border-neutral-850 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 px-2">
              <CappLogo size="sm" />
              <span className="font-bold text-sm tracking-tight text-white">Settings</span>
            </div>

            <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-1 md:pb-0">
              <button
                onClick={() => setActiveTab('general')}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors shrink-0 ${
                  activeTab === 'general'
                    ? 'bg-neutral-800 text-white font-semibold'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>General</span>
              </button>

              <button
                onClick={() => setActiveTab('model')}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors shrink-0 ${
                  activeTab === 'model'
                    ? 'bg-neutral-800 text-white font-semibold'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>AI Model</span>
              </button>

              <button
                onClick={() => setActiveTab('usage')}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors shrink-0 cursor-pointer ${
                  activeTab === 'usage'
                    ? 'bg-neutral-800 text-white font-semibold'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-sky-400" />
                <span>Usage Statistics</span>
              </button>

              <button
                onClick={() => setActiveTab('memory')}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors shrink-0 ${
                  activeTab === 'memory'
                    ? 'bg-neutral-800 text-white font-semibold'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                }`}
              >
                <Brain className="w-4 h-4" />
                <span>Memory</span>
              </button>

              <button
                onClick={() => setActiveTab('privacy')}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors shrink-0 ${
                  activeTab === 'privacy'
                    ? 'bg-neutral-800 text-white font-semibold'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Data & Privacy</span>
              </button>

              <button
                onClick={() => setActiveTab('account')}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors shrink-0 ${
                  activeTab === 'account'
                    ? 'bg-neutral-800 text-white font-semibold'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Account</span>
              </button>

              <button
                onClick={() => setActiveTab('about')}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors shrink-0 ${
                  activeTab === 'about'
                    ? 'bg-neutral-800 text-white font-semibold'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                }`}
              >
                <Info className="w-4 h-4" />
                <span>About</span>
              </button>
            </nav>
          </div>

          <div className="hidden md:block pt-4 border-t border-neutral-850 px-2 text-[10px] text-neutral-500">
            CAPP AI v1.0.0 (Production)
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar with Close */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
            <h2 className="text-base font-semibold text-white capitalize">
              {activeTab === 'model'
                ? 'AI Model & Response Style'
                : activeTab === 'usage'
                ? 'Usage Statistics & Trends'
                : `${activeTab} Settings`}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
            {/* Usage Statistics Tab */}
            {activeTab === 'usage' && (
              <UsageStatisticsView conversations={conversations} />
            )}

            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                    Appearance
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleThemeChange('dark')}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                        settings.theme === 'dark'
                          ? 'border-white bg-neutral-800 text-white'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white hover:bg-neutral-900'
                      }`}
                    >
                      <Moon className="w-5 h-5 mb-1.5" />
                      <span className="text-xs font-medium">Dark Mode</span>
                    </button>
                    <button
                      onClick={() => handleThemeChange('light')}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                        settings.theme === 'light'
                          ? 'border-white bg-neutral-800 text-white'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white hover:bg-neutral-900'
                      }`}
                    >
                      <Sun className="w-5 h-5 mb-1.5" />
                      <span className="text-xs font-medium">Light Mode</span>
                    </button>
                    <button
                      onClick={() => handleThemeChange('system')}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                        settings.theme === 'system'
                          ? 'border-white bg-neutral-800 text-white'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white hover:bg-neutral-900'
                      }`}
                    >
                      <Laptop className="w-5 h-5 mb-1.5" />
                      <span className="text-xs font-medium">System</span>
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-neutral-200">Real-time Stream Typing</div>
                    <div className="text-xs text-neutral-400">
                      Display words dynamically as CAPP AI generates them.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enableStreaming}
                    onChange={handleToggleStreaming}
                    className="w-5 h-5 rounded accent-neutral-200 cursor-pointer"
                  />
                </div>

                {/* Voice Synthesis / Text-to-Speech (TTS) Voice Selection */}
                <div className="pt-4 border-t border-neutral-800 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                      Text-to-Speech (TTS) Voice
                    </label>
                    <p className="text-xs text-neutral-400">
                      Choose the browser voice CAPP AI uses when reading assistant responses aloud.
                    </p>
                  </div>

                  {ttsSupported ? (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <div className="relative flex-1">
                        <select
                          value={settings.ttsVoice || ''}
                          onChange={handleVoiceChange}
                          className="w-full py-2.5 px-3 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 text-xs font-medium focus:outline-hidden focus:border-neutral-600 appearance-none pr-9 cursor-pointer"
                        >
                          <option value="">Default Natural Voice (Automatic)</option>
                          {voices.map((v) => (
                            <option key={`${v.name}-${v.lang}`} value={v.voiceURI || v.name}>
                              {v.name} ({v.lang}) {v.localService ? '• Local' : '• Online'}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-neutral-400">
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                          </svg>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleTestVoice(settings.ttsVoice || '')}
                        className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all shrink-0 ${
                          isPlayingPreview
                            ? 'bg-sky-500/25 text-sky-200 border border-sky-500/40 hover:bg-sky-500/35 shadow-xs'
                            : 'bg-neutral-800 hover:bg-neutral-750 text-neutral-200 hover:text-white border border-neutral-700'
                        }`}
                        title={isPlayingPreview ? 'Stop test preview' : 'Preview selected voice'}
                      >
                        {isPlayingPreview ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5 text-sky-300 animate-pulse" />
                            <span>Stop</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-neutral-300" />
                            <span>Preview</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-400">
                      Speech Synthesis is not supported in this browser.
                    </div>
                  )}

                  {settings.ttsVoice && (
                    <div className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>
                        Custom voice active:{' '}
                        <strong className="text-neutral-200">{settings.ttsVoice}</strong>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Model Tab */}
            {activeTab === 'model' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                    Active Foundation Engine
                  </label>
                  <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-neutral-800 text-white">
                      <Sparkles className="w-5 h-5 text-amber-300" />
                    </div>
                    <div>
                      <div className="font-semibold text-white flex items-center gap-2">
                        <span>Gemini 3.8 Flash</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Active
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 mt-1">
                        High-efficiency multimodal model with fast latency and advanced reasoning across code, text, and documents.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                    Response Style
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['concise', 'balanced', 'detailed', 'creative'] as ResponseStyle[]).map(
                      (style) => (
                        <button
                          key={style}
                          onClick={() => handleResponseStyleChange(style)}
                          className={`p-2.5 rounded-xl border text-xs capitalize font-medium transition-all ${
                            settings.responseStyle === style
                              ? 'border-white bg-neutral-800 text-white shadow-xs'
                              : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                          }`}
                        >
                          {style}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                      Creativity & Sampling (Temperature: {settings.temperature})
                    </label>
                    <span className="text-xs text-neutral-400">
                      {settings.temperature < 0.4
                        ? 'Precise & Direct'
                        : settings.temperature > 0.8
                        ? 'Highly Creative'
                        : 'Balanced'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settings.temperature}
                    onChange={(e) => handleTemperatureChange(parseFloat(e.target.value))}
                    className="w-full accent-white cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Memory Tab */}
            {activeTab === 'memory' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800">
                  <div>
                    <div className="font-semibold text-neutral-100">Persistent Assistant Memory</div>
                    <div className="text-xs text-neutral-400">
                      CAPP AI remembers key facts across sessions to personalize your workflow.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enableMemory}
                    onChange={handleToggleMemory}
                    className="w-5 h-5 rounded accent-neutral-200 cursor-pointer"
                  />
                </div>

                {/* Add new memory */}
                <form onSubmit={handleAddMemorySubmit} className="space-y-2">
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    Add Explicit Memory
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g., 'Prefer TypeScript solutions with strict typing'..."
                      value={newMemoryText}
                      onChange={(e) => setNewMemoryText(e.target.value)}
                      className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-hidden focus:border-neutral-600"
                    />
                    <button
                      type="submit"
                      disabled={!newMemoryText.trim()}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white text-neutral-950 text-xs font-medium hover:bg-neutral-200 disabled:opacity-40 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </form>

                {/* Memory items list */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                      Saved Facts ({memories.length})
                    </span>
                    {memories.length > 0 && (
                      <button
                        onClick={onClearMemories}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {memories.length === 0 ? (
                    <div className="p-6 text-center text-xs text-neutral-500 rounded-xl bg-neutral-950 border border-neutral-850">
                      No memories saved yet. Add instructions or preferences above.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {memories.map((mem) => (
                        <div
                          key={mem.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-300"
                        >
                          <span className="truncate flex-1 pr-2">{mem.text}</span>
                          <button
                            onClick={() => onDeleteMemory(mem.id)}
                            className="p-1 text-neutral-500 hover:text-red-400 transition-colors"
                            title="Delete memory"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-neutral-100 mb-1">Data Ownership & Privacy</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Conversations and uploaded documents are processed securely through the dedicated CAPP AI server proxy. Your API secrets and private data are never exposed client-side.
                  </p>
                </div>

                <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-neutral-200">Export All Data</div>
                    <div className="text-xs text-neutral-400">
                      Download all saved conversations and preferences as a JSON file.
                    </div>
                  </div>
                  <button
                    onClick={onExportData}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium border border-neutral-700 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export</span>
                  </button>
                </div>

                <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-neutral-200">Export Source Code (.ZIP)</div>
                    <div className="text-xs text-neutral-400">
                      Download complete CAPP project source code as a ZIP archive.
                    </div>
                  </div>
                  <a
                    href="/capp-source-code.zip"
                    download="capp-source-code.zip"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 text-xs font-medium border border-sky-500/30 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download ZIP</span>
                  </a>
                </div>

                <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-red-400">Clear All Chat History</div>
                    <div className="text-xs text-neutral-400">
                      Permanently wipe all conversations and message transcripts.
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete all conversations? This cannot be undone.')) {
                        onClearAllConversations();
                        onClose();
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium border border-red-500/30 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All</span>
                  </button>
                </div>
              </div>
            )}

            {/* Account Tab */}
            {activeTab === 'account' && (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-neutral-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-neutral-600"
                  />
                </div>

                <div className="pt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-neutral-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Logged In (Session Verified)</span>
                  </div>

                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-neutral-950 text-xs font-semibold hover:bg-neutral-200 transition-colors"
                  >
                    {saveSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Saved!</span>
                      </>
                    ) : (
                      <span>Save Changes</span>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* About Tab */}
            {activeTab === 'about' && (
              <div className="space-y-4 text-neutral-300">
                <div className="flex items-center gap-3">
                  <CappLogo size="md" />
                  <div>
                    <h3 className="font-extrabold text-base text-white">CAPP AI</h3>
                    <p className="text-xs text-neutral-400">Think smarter. Create more.</p>
                  </div>
                </div>

                <p className="text-xs leading-relaxed text-neutral-400 pt-2">
                  CAPP AI is an intelligent progressive web app designed specifically for Android phones, tablets, and desktop. Built with full-stack TypeScript, React 19, and Gemini intelligence, it delivers fast reasoning, creative assistance, and image intelligence directly from your home screen.
                </p>

                <div className="pt-4 border-t border-neutral-800 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-neutral-500 block">Version</span>
                    <span className="font-mono text-neutral-200">CAPP AI v1.0.0</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Short Name</span>
                    <span className="text-neutral-200">CAPP</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Application Type</span>
                    <span className="text-emerald-400 font-medium">Progressive Web App (PWA)</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Display Mode</span>
                    <span className="text-neutral-200">Standalone (Android Optimized)</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Offline Cache</span>
                    <span className="text-neutral-200">Service Worker Shell</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">AI Backend</span>
                    <span className="text-neutral-200">Isolated Express Server Proxy</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-800">
                  <a
                    href="/capp-source-code.zip"
                    download="capp-source-code.zip"
                    className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs border border-neutral-700 transition-colors shadow-sm"
                  >
                    <Download className="w-4 h-4 text-sky-400" />
                    <span>Download Complete Source Code (.ZIP)</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
