import React, { useState, useEffect, useRef } from 'react';
import {
  Conversation,
  Message,
  Attachment,
  AppSettings,
  MemoryItem,
  UserProfile,
  GroundingSource,
} from './types';
import { storage, DEFAULT_SETTINGS, DEFAULT_USER } from './services/storage';
import { aiService } from './services/aiService';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { MessageComposer } from './components/MessageComposer';
import { SettingsModal } from './components/SettingsModal';
import { ToolsModal } from './components/ToolsModal';
import { ImageStudioModal } from './components/ImageStudioModal';
import { ShareModal } from './components/ShareModal';
import { WelcomeModal } from './components/WelcomeModal';
import { PWAInstallPrompt } from './components/pwa/PWAInstallPrompt';
import { logToolUsage } from './utils/usageTracking';

export default function App() {
  // App State
  const [conversations, setConversations] = useState<Conversation[]>(() =>
    storage.getConversations()
  );
  const [currentConvoId, setCurrentConvoId] = useState<string | null>(() =>
    storage.getCurrentConversationId()
  );
  const [settings, setSettings] = useState<AppSettings>(() => storage.getSettings());
  const [memories, setMemories] = useState<MemoryItem[]>(() => storage.getMemories());
  const [user, setUser] = useState<UserProfile>(() => storage.getUser());

  // UI state
  const [isStreaming, setIsStreaming] = useState(false);
  const [composerInitialText, setComposerInitialText] = useState('');
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [isSidebarCollapsedDesktop, setIsSidebarCollapsedDesktop] = useState(false);

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isImageStudioOpen, setIsImageStudioOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(() => !storage.isOnboarded());

  // Active abort controller
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync theme with document element
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'light') {
      root.classList.remove('dark');
    } else if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      // System
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [settings.theme]);

  // Persist conversations
  useEffect(() => {
    storage.saveConversations(conversations);
  }, [conversations]);

  // Persist current convo id
  useEffect(() => {
    storage.setCurrentConversationId(currentConvoId);
  }, [currentConvoId]);

  // Get active conversation
  const currentConversation = conversations.find((c) => c.id === currentConvoId) || null;
  const currentMessages = currentConversation ? currentConversation.messages : [];

  // Start new chat
  const handleNewChat = () => {
    if (isStreaming && abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setCurrentConvoId(null);
    setComposerInitialText('');
    setIsSidebarOpenMobile(false);
  };

  // Select conversation
  const handleSelectConversation = (id: string) => {
    if (isStreaming && abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setCurrentConvoId(id);
    setComposerInitialText('');
  };

  // Delete conversation
  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (currentConvoId === id) {
      setCurrentConvoId(null);
    }
  };

  // Rename conversation
  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle, updatedAt: Date.now() } : c))
    );
  };

  // Pin/Unpin conversation
  const handleTogglePinConversation = (id: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, isPinned: !c.isPinned, updatedAt: Date.now() } : c
      )
    );
  };

  // Send message
  const handleSendMessage = async (
    text: string,
    attachments: Attachment[] = [],
    customInstruction?: string
  ) => {
    if ((!text.trim() && attachments.length === 0) || isStreaming) return;

    let convoId = currentConvoId;
    let targetConvo = currentConversation;

    // If starting a fresh chat, create the conversation object
    if (!convoId || !targetConvo) {
      convoId = `convo-${Date.now()}`;
      const title = aiService.generateTitle(text || attachments[0]?.name || 'New Conversation');
      const newConvo: Conversation = {
        id: convoId,
        title,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
      };
      targetConvo = newConvo;
      setConversations((prev) => [newConvo, ...prev]);
      setCurrentConvoId(convoId);
    }

    const userMessage: Message = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      text,
      timestamp: Date.now(),
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    const assistantPlaceholderId = `msg-${Date.now()}-assistant`;
    const assistantMessage: Message = {
      id: assistantPlaceholderId,
      role: 'assistant',
      text: '',
      timestamp: Date.now(),
      isStreaming: true,
    };

    // Update conversation with user and placeholder assistant messages
    const updatedMessages = [...targetConvo.messages, userMessage, assistantMessage];

    setConversations((prev) =>
      prev.map((c) =>
        c.id === convoId
          ? { ...c, messages: updatedMessages, updatedAt: Date.now() }
          : c
      )
    );

    setIsStreaming(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Prepare message payload for Gemini
    const messagesPayload = updatedMessages
      .filter((m) => m.id !== assistantPlaceholderId)
      .map((m) => ({
        role: m.role,
        text: m.text,
        attachments: m.attachments?.map((att) => ({
          mimeType: att.mimeType,
          data: att.data,
        })),
      }));

    // Memory facts if enabled
    const memoryFacts = settings.enableMemory ? memories.map((m) => m.text) : [];

    let accumulatedText = '';
    let accumulatedSources: GroundingSource[] = [];

    await aiService.streamChat({
      messages: messagesPayload,
      memories: memoryFacts,
      webSearch: settings.enableWebSearch,
      temperature: settings.temperature,
      stream: settings.enableStreaming,
      customInstruction,
      signal: abortController.signal,
      onChunk: (chunk) => {
        accumulatedText += chunk;
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== convoId) return c;
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === assistantPlaceholderId
                  ? { ...m, text: accumulatedText, isStreaming: true }
                  : m
              ),
            };
          })
        );
      },
      onSources: (sources) => {
        accumulatedSources = sources;
        if (sources && sources.length > 0) {
          logToolUsage('web_search', { count: sources.length });
        }
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== convoId) return c;
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === assistantPlaceholderId
                  ? { ...m, sources: accumulatedSources }
                  : m
              ),
            };
          })
        );
      },
      onError: (errorText) => {
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== convoId) return c;
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === assistantPlaceholderId
                  ? {
                      ...m,
                      text: errorText,
                      isError: true,
                      isStreaming: false,
                    }
                  : m
              ),
            };
          })
        );
      },
      onDone: () => {
        setIsStreaming(false);
        abortControllerRef.current = null;
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== convoId) return c;
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === assistantPlaceholderId
                  ? { ...m, isStreaming: false }
                  : m
              ),
            };
          })
        );
      },
    });
  };

  // Stop Generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
    }
  };

  // Regenerate Response
  const handleRegenerate = () => {
    if (!currentConversation || currentConversation.messages.length < 2 || isStreaming) return;

    // Find last user message
    const msgs = [...currentConversation.messages];
    const lastUserIdx = msgs.map((m) => m.role).lastIndexOf('user');
    if (lastUserIdx === -1) return;

    const userMsg = msgs[lastUserIdx];
    // Remove everything from the last user message onwards and re-send
    const prunedMsgs = msgs.slice(0, lastUserIdx);

    setConversations((prev) =>
      prev.map((c) =>
        c.id === currentConversation.id ? { ...c, messages: prunedMsgs } : c
      )
    );

    handleSendMessage(userMsg.text, userMsg.attachments || []);
  };

  // Edit User Message
  const handleEditMessage = (messageIndex: number, newText: string) => {
    if (!currentConversation || isStreaming) return;
    const targetMsg = currentConversation.messages[messageIndex];
    if (!targetMsg || targetMsg.role !== 'user') return;

    // Truncate messages up to this point
    const truncated = currentConversation.messages.slice(0, messageIndex);
    setConversations((prev) =>
      prev.map((c) =>
        c.id === currentConversation.id ? { ...c, messages: truncated } : c
      )
    );

    // Re-send with new text and existing attachments
    handleSendMessage(newText, targetMsg.attachments || []);
  };

  // Message feedback
  const handleFeedback = (messageId: string, type: 'like' | 'dislike') => {
    if (!currentConversation) return;
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== currentConversation.id) return c;
        return {
          ...c,
          messages: c.messages.map((m) => {
            if (m.id !== messageId) return m;
            return {
              ...m,
              liked: type === 'like' ? !m.liked : false,
              disliked: type === 'dislike' ? !m.disliked : false,
            };
          }),
        };
      })
    );
  };

  // Memory management
  const handleAddMemory = (text: string) => {
    const newMem: MemoryItem = {
      id: `mem-${Date.now()}`,
      text,
      createdAt: Date.now(),
    };
    const updated = [...memories, newMem];
    setMemories(updated);
    storage.saveMemories(updated);
  };

  const handleDeleteMemory = (id: string) => {
    const updated = memories.filter((m) => m.id !== id);
    setMemories(updated);
    storage.saveMemories(updated);
  };

  const handleClearMemories = () => {
    setMemories([]);
    storage.saveMemories([]);
  };

  // Save Settings
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    storage.saveSettings(newSettings);
  };

  // Save User
  const handleSaveUser = (newUser: UserProfile) => {
    setUser(newUser);
    storage.saveUser(newUser);
  };

  // Clear all conversations
  const handleClearAllConversations = () => {
    setConversations([]);
    setCurrentConvoId(null);
    storage.saveConversations([]);
    storage.setCurrentConversationId(null);
  };

  // Export Data as JSON
  const handleExportData = () => {
    const data = {
      conversations,
      memories,
      settings,
      exportedAt: new Date().toISOString(),
      app: 'CAPP AI',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `capp-ai-data-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Toggle Web Search grounding
  const handleToggleWebSearch = () => {
    handleSaveSettings({
      ...settings,
      enableWebSearch: !settings.enableWebSearch,
    });
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-neutral-950 text-neutral-100 font-sans">
      {/* Sidebar (Desktop Collapsible & Mobile Drawer) */}
      <Sidebar
        conversations={conversations}
        currentId={currentConvoId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onTogglePinConversation={handleTogglePinConversation}
        isOpenMobile={isSidebarOpenMobile}
        onCloseMobile={() => setIsSidebarOpenMobile(false)}
        isCollapsedDesktop={isSidebarCollapsedDesktop}
        onToggleCollapseDesktop={() =>
          setIsSidebarCollapsedDesktop(!isSidebarCollapsedDesktop)
        }
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenTools={() => setIsToolsOpen(true)}
        onOpenImageStudio={() => setIsImageStudioOpen(true)}
        user={user}
      />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-neutral-950">
        {/* App Header */}
        <Header
          title={currentConversation?.title}
          onOpenSidebar={() => setIsSidebarOpenMobile(true)}
          onNewChat={handleNewChat}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenTools={() => setIsToolsOpen(true)}
          onOpenImageStudio={() => setIsImageStudioOpen(true)}
          onShare={() => setIsShareOpen(true)}
          user={user}
          webSearchActive={settings.enableWebSearch}
          onToggleWebSearch={handleToggleWebSearch}
          isStreaming={isStreaming}
        />

        {/* Chat Scrollable Area */}
        <ChatArea
          messages={currentMessages}
          isStreaming={isStreaming}
          onSelectPrompt={(prompt) => handleSendMessage(prompt)}
          onRegenerate={handleRegenerate}
          onEditMessage={handleEditMessage}
          onFeedback={handleFeedback}
          onShare={() => setIsShareOpen(true)}
          ttsVoice={settings.ttsVoice}
          conversationTitle={currentConversation?.title}
        />

        {/* Message Input Composer */}
        <MessageComposer
          onSendMessage={handleSendMessage}
          onStopGeneration={handleStopGeneration}
          isGenerating={isStreaming}
          onOpenImageStudio={() => setIsImageStudioOpen(true)}
          onOpenTools={() => setIsToolsOpen(true)}
          initialText={composerInitialText}
        />
      </div>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        memories={memories}
        onAddMemory={handleAddMemory}
        onDeleteMemory={handleDeleteMemory}
        onClearMemories={handleClearMemories}
        user={user}
        onSaveUser={handleSaveUser}
        onClearAllConversations={handleClearAllConversations}
        onExportData={handleExportData}
        conversations={conversations}
      />

      <ToolsModal
        isOpen={isToolsOpen}
        onClose={() => setIsToolsOpen(false)}
        onApplyToolPrompt={(prompt) => {
          handleSendMessage(prompt);
        }}
      />

      <ImageStudioModal
        isOpen={isImageStudioOpen}
        onClose={() => setIsImageStudioOpen(false)}
        onSendToChat={(text, imgAtt) => {
          const attachments: Attachment[] = imgAtt
            ? [
                {
                  id: `img-${Date.now()}`,
                  name: imgAtt.name,
                  type: 'image',
                  mimeType: imgAtt.mimeType,
                  size: Math.round(imgAtt.data.length * 0.75),
                  data: imgAtt.data,
                  previewUrl: imgAtt.data,
                },
              ]
            : [];
          handleSendMessage(text, attachments);
        }}
      />

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        conversation={currentConversation}
      />

      <WelcomeModal
        isOpen={isWelcomeOpen}
        onStartChatting={() => {
          storage.setOnboarded();
          setIsWelcomeOpen(false);
        }}
        onExplore={() => {
          storage.setOnboarded();
          setIsWelcomeOpen(false);
          setIsToolsOpen(true);
        }}
      />

      {/* Non-intrusive Android & PWA Install Bottom-Sheet Prompt */}
      <PWAInstallPrompt />
    </div>
  );
}
