import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  Copy,
  Check,
  RotateCw,
  Edit3,
  ThumbsUp,
  ThumbsDown,
  Volume2,
  VolumeX,
  Share2,
  ArrowDown,
  ExternalLink,
  Sparkles,
  Code2,
  PenTool,
  HelpCircle,
  Lightbulb,
  FileText,
  AlertTriangle,
  BookOpen,
  ArrowLeft,
  Printer,
  Type,
} from 'lucide-react';
import { Message, Attachment, GroundingSource } from '../types';
import { CappLogo } from './CappLogo';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { FollowUpPromptButtons } from './FollowUpPromptButtons';
import { generateFollowUpPrompts } from '../utils/generateFollowUpPrompts';

interface ChatAreaProps {
  messages: Message[];
  isStreaming: boolean;
  onSelectPrompt: (promptText: string) => void;
  onRegenerate: () => void;
  onEditMessage: (messageIndex: number, newText: string) => void;
  onFeedback: (messageId: string, type: 'like' | 'dislike') => void;
  onShare: () => void;
  ttsVoice?: string;
  conversationTitle?: string;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  isStreaming,
  onSelectPrompt,
  onRegenerate,
  onEditMessage,
  onFeedback,
  onShare,
  ttsVoice,
  conversationTitle,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Reader Mode state
  const [isReaderMode, setIsReaderMode] = useState(false);
  const [readerFontSize, setReaderFontSize] = useState<'normal' | 'large'>('normal');
  const [readerFontFamily, setReaderFontFamily] = useState<'sans' | 'serif'>('sans');
  const [copiedDocument, setCopiedDocument] = useState(false);

  // Text-To-Speech hook with natural voice selection & sentence chunking
  const { speakingId, isSupported: ttsSupported, speak, stop: stopSpeaking } = useTextToSpeech(ttsVoice);

  // Calculate word count and estimated reading time for Reader Mode
  const { wordCount, estimatedReadTime } = useMemo(() => {
    let words = 0;
    messages.forEach((m) => {
      if (m.text) {
        words += m.text.trim().split(/\s+/).filter(Boolean).length;
      }
    });
    const minutes = Math.max(1, Math.ceil(words / 200));
    return { wordCount: words, estimatedReadTime: minutes };
  }, [messages]);

  // Analyze last assistant message to generate 2-3 dynamic follow-up prompt buttons
  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  const isLastAssistant = lastMessage?.role === 'assistant';
  const previousUserText =
    isLastAssistant && messages.length > 1
      ? messages[messages.length - 2]?.text
      : undefined;

  const followUpPrompts = useMemo(() => {
    if (
      !isLastAssistant ||
      !lastMessage ||
      lastMessage.isStreaming ||
      lastMessage.isError ||
      !lastMessage.text ||
      lastMessage.text.trim().length === 0
    ) {
      return [];
    }

    return generateFollowUpPrompts(lastMessage.text, previousUserText);
  }, [
    isLastAssistant,
    lastMessage?.id,
    lastMessage?.isStreaming,
    lastMessage?.isError,
    lastMessage?.text,
    previousUserText,
  ]);

  // Auto-scroll to bottom as new tokens arrive (only in standard chat mode)
  useEffect(() => {
    if (!isReaderMode && !showScrollBottom && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages, isStreaming, showScrollBottom, isReaderMode]);

  // Check scroll position for "Scroll to bottom" button
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 120;
    setShowScrollBottom(!isNearBottom);
  };

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyDocumentText = () => {
    let fullDoc = `${conversationTitle || 'CAPP AI Conversation'}\n\n`;
    messages.forEach((m) => {
      const role = m.role === 'user' ? 'USER' : 'CAPP AI';
      fullDoc += `[${role}]\n${m.text}\n\n`;
    });
    navigator.clipboard.writeText(fullDoc);
    setCopiedDocument(true);
    setTimeout(() => setCopiedDocument(false), 2000);
  };

  const startEdit = (idx: number, currentText: string) => {
    setEditingIndex(idx);
    setEditText(currentText);
  };

  const saveEdit = (idx: number) => {
    if (editText.trim()) {
      onEditMessage(idx, editText.trim());
    }
    setEditingIndex(null);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
  };

  const suggestedPrompts = [
    {
      title: 'Explain something to me',
      subtitle: 'Quantum computing in simple terms',
      icon: HelpCircle,
      prompt: 'Explain quantum computing to me in simple terms with an intuitive analogy.',
    },
    {
      title: 'Help me write something',
      subtitle: 'Executive summary for a product launch',
      icon: PenTool,
      prompt: 'Help me draft a concise, persuasive executive summary for a new AI product launch.',
    },
    {
      title: 'Analyze this image',
      subtitle: 'Upload a screenshot or photo for deep insights',
      icon: Sparkles,
      prompt: 'What are the best principles to analyze and improve modern UI design systems?',
    },
    {
      title: 'Help me code',
      subtitle: 'Debug, refactor, or build a React feature',
      icon: Code2,
      prompt: 'Write a high-performance TypeScript hook to handle debounced search inputs with error recovery.',
    },
    {
      title: 'Brainstorm an idea',
      subtitle: 'Unique startup concepts for 2026',
      icon: Lightbulb,
      prompt: 'Brainstorm 5 innovative startup concepts combining real-time edge AI with sustainable green tech.',
    },
  ];

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="relative flex-1 overflow-y-auto px-3 sm:px-6 py-6 scroll-smooth"
    >
      {/* ======================================================== */}
      {/* READER MODE VIEW: Clean, Distraction-Free Document Flow  */}
      {/* ======================================================== */}
      {isReaderMode && messages.length > 0 ? (
        <div className="max-w-3xl mx-auto py-2 sm:py-6 animate-in fade-in duration-300">
          {/* Sticky Reader Mode Document Toolbar */}
          <div className="sticky top-0 z-20 flex items-center justify-between py-2.5 px-3.5 mb-8 bg-neutral-900/95 backdrop-blur-md border border-neutral-800 rounded-2xl shadow-xl">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsReaderMode(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-white text-xs font-semibold border border-neutral-700 transition-all cursor-pointer active:scale-95"
                title="Return to standard chat interface"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Exit Reader Mode</span>
              </button>
              <span className="text-xs text-neutral-400 font-medium hidden sm:inline">
                Document Reading View
              </span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Font Family Toggle */}
              <div className="flex items-center bg-neutral-950 p-0.5 rounded-lg border border-neutral-800 text-xs">
                <button
                  onClick={() => setReaderFontFamily('sans')}
                  className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                    readerFontFamily === 'sans'
                      ? 'bg-neutral-800 text-white font-medium'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                  title="Sans-serif font"
                >
                  Sans
                </button>
                <button
                  onClick={() => setReaderFontFamily('serif')}
                  className={`px-2 py-1 rounded-md font-serif transition-colors cursor-pointer ${
                    readerFontFamily === 'serif'
                      ? 'bg-neutral-800 text-white font-medium'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                  title="Editorial serif font"
                >
                  Serif
                </button>
              </div>

              {/* Font Size Toggle */}
              <div className="flex items-center bg-neutral-950 p-0.5 rounded-lg border border-neutral-800 text-xs">
                <button
                  onClick={() => setReaderFontSize('normal')}
                  className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                    readerFontSize === 'normal'
                      ? 'bg-neutral-800 text-white font-medium'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                  title="Standard font size"
                >
                  A
                </button>
                <button
                  onClick={() => setReaderFontSize('large')}
                  className={`px-2 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                    readerFontSize === 'large'
                      ? 'bg-neutral-800 text-white'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                  title="Large font size"
                >
                  A+
                </button>
              </div>

              {/* Copy Document */}
              <button
                onClick={handleCopyDocumentText}
                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-white border border-neutral-750 transition-colors cursor-pointer"
                title="Copy entire document text"
              >
                {copiedDocument ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>

              {/* Print Document */}
              <button
                onClick={() => window.print()}
                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-white border border-neutral-750 transition-colors cursor-pointer"
                title="Print document"
              >
                <Printer className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Document Header */}
          <header className="mb-10 pb-6 border-b border-neutral-800/80">
            <div className="flex items-center gap-2 text-xs font-semibold text-sky-400 tracking-wider uppercase mb-2">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Reader Document</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-3 leading-tight">
              {conversationTitle || 'Conversation Reading'}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400">
              <span>{messages.length} exchanges</span>
              <span>•</span>
              <span>{estimatedReadTime} min read</span>
              <span>•</span>
              <span>{wordCount.toLocaleString()} words</span>
            </div>
          </header>

          {/* Document Content: Clean, linear prose without bubbles, avatars, or extra buttons */}
          <div
            className={`space-y-12 ${
              readerFontFamily === 'serif' ? 'font-serif' : 'font-sans'
            } ${
              readerFontSize === 'large'
                ? 'text-lg leading-relaxed sm:leading-loose'
                : 'text-base leading-relaxed'
            }`}
          >
            {messages.map((message, idx) => {
              const isUser = message.role === 'user';

              return (
                <article
                  key={message.id || idx}
                  className="transition-colors pt-6 first:pt-0 border-t first:border-t-0 border-neutral-850"
                >
                  {isUser ? (
                    /* User Query styled as clear section heading */
                    <div className="mb-4">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                        <span>Prompt</span>
                      </div>
                      <div className="text-xl sm:text-2xl font-bold text-neutral-100 tracking-tight">
                        {message.text}
                      </div>

                      {/* Attached images in Reader Mode */}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-3 mt-3">
                          {message.attachments.map((att) =>
                            att.type === 'image' && att.previewUrl ? (
                              <img
                                key={att.id}
                                src={att.previewUrl}
                                alt={att.name}
                                className="max-h-72 rounded-xl object-contain border border-neutral-800"
                              />
                            ) : null
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Assistant Output styled as clean editorial article prose */
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-sky-400 mb-2.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                        <span>CAPP AI</span>
                      </div>
                      <div className="text-neutral-200">
                        <MarkdownRenderer content={message.text} />
                      </div>

                      {/* References / Grounding Sources */}
                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-6 pt-4 border-t border-neutral-850 text-xs text-neutral-400">
                          <div className="font-semibold text-neutral-300 mb-1.5">References:</div>
                          <ul className="list-disc list-inside space-y-1">
                            {message.sources.map((s, sIdx) => (
                              <li key={sIdx}>
                                <a
                                  href={s.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sky-400 hover:underline inline-flex items-center gap-1"
                                >
                                  <span>{s.title}</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      ) : (
        /* ======================================================== */
        /* STANDARD CHAT VIEW: Interactive Bubbles & Controls       */
        /* ======================================================== */
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Welcome Screen when conversation is empty */}
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-in fade-in duration-500">
              <CappLogo size="xl" animated={true} />

              <h1 className="mt-6 text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                Hello, I'm CAPP AI.
              </h1>

              <p className="mt-2 text-base sm:text-lg text-neutral-400 font-normal">
                How can I help you today?
              </p>

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 w-full max-w-2xl text-left">
                {suggestedPrompts.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => onSelectPrompt(item.prompt)}
                      className="group relative flex flex-col p-3.5 rounded-2xl bg-neutral-900/70 hover:bg-neutral-850/90 border border-neutral-800 hover:border-neutral-700 transition-all text-left shadow-xs hover:shadow-md cursor-pointer"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="p-1.5 rounded-lg bg-neutral-800 text-neutral-300 group-hover:text-white group-hover:bg-neutral-750 transition-colors">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="font-semibold text-xs text-neutral-200 group-hover:text-white">
                          {item.title}
                        </span>
                      </div>
                      <span className="text-[11px] text-neutral-500 leading-snug line-clamp-2">
                        {item.subtitle}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              {/* Chat View Header Toolbar with Reader Mode Trigger */}
              <div className="flex items-center justify-between pb-3 border-b border-neutral-850 text-xs">
                <div className="text-[11px] text-neutral-400 font-medium">
                  {messages.length} {messages.length === 1 ? 'message' : 'messages'}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsReaderMode(true);
                      if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 text-neutral-300 hover:text-white border border-neutral-800 hover:border-neutral-700 text-xs font-medium transition-all shadow-xs cursor-pointer active:scale-95"
                    title="Switch to clean, distraction-free document layout"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                    <span>Reader Mode</span>
                  </button>

                  <button
                    onClick={onShare}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 text-neutral-300 hover:text-white border border-neutral-800 hover:border-neutral-700 text-xs font-medium transition-all shadow-xs cursor-pointer active:scale-95"
                    title="Share or export conversation"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Export</span>
                  </button>
                </div>
              </div>

              {/* Messages Stream */}
              {messages.map((message, idx) => {
                const isUser = message.role === 'user';
                const isLastModel = !isUser && idx === messages.length - 1;

                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 sm:gap-4 ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}
                  >
                    {/* Assistant Avatar */}
                    {!isUser && (
                      <div className="shrink-0 mt-1">
                        <CappLogo size="sm" />
                      </div>
                    )}

                    {/* Message Body */}
                    <div
                      className={`flex flex-col max-w-[88%] sm:max-w-[80%] ${
                        isUser ? 'items-end' : 'items-start flex-1'
                      }`}
                    >
                      {/* Sender label */}
                      <div className="flex items-center gap-2 mb-1 text-[11px] font-medium text-neutral-400">
                        <span>{isUser ? 'You' : 'CAPP AI'}</span>
                        <span className="text-neutral-600">
                          {new Date(message.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {/* User Attachments Preview */}
                      {isUser && message.attachments && message.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2 justify-end">
                          {message.attachments.map((att) => (
                            <div
                              key={att.id}
                              className="flex items-center gap-2 p-1.5 rounded-xl bg-neutral-900 border border-neutral-800 max-w-xs"
                            >
                              {att.type === 'image' && att.previewUrl ? (
                                <img
                                  src={att.previewUrl}
                                  alt={att.name}
                                  className="w-16 h-16 object-cover rounded-lg border border-neutral-700"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-300">
                                  <FileText className="w-5 h-5" />
                                </div>
                              )}
                              <div className="text-xs truncate text-neutral-300">
                                <div className="font-medium truncate">{att.name}</div>
                                <div className="text-[10px] text-neutral-500">
                                  {(att.size / 1024).toFixed(0)} KB
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Message Bubble */}
                      <div
                        className={`rounded-2xl px-4 py-3 text-sm sm:text-base leading-relaxed relative group transition-all ${
                          isUser
                            ? 'bg-neutral-800 text-white rounded-br-xs'
                            : `bg-neutral-900/60 text-neutral-100 border rounded-bl-xs w-full shadow-xs ${
                                speakingId === message.id
                                  ? 'border-sky-500/50 bg-sky-950/20 ring-1 ring-sky-500/30'
                                  : 'border-neutral-800/80'
                              }`
                        }`}
                      >
                        {isUser ? (
                          editingIndex === idx ? (
                            <div className="w-full space-y-2">
                              <textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-white text-sm focus:outline-hidden focus:border-neutral-500 resize-none min-h-[80px]"
                                rows={3}
                                autoFocus
                              />
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={cancelEdit}
                                  className="px-3 py-1 text-xs text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-700/50 transition-colors cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => saveEdit(idx)}
                                  className="px-3 py-1 text-xs bg-white text-neutral-900 font-semibold rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer"
                                >
                                  Save & Resend
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="whitespace-pre-wrap select-text">{message.text}</div>
                          )
                        ) : (
                          <div>
                            {message.isError ? (
                              <div className="flex items-start gap-2 text-rose-400 py-1">
                                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                                <div>
                                  <div className="font-semibold text-sm">Response Error</div>
                                  <div className="text-xs text-rose-300/90 mt-0.5">{message.text}</div>
                                </div>
                              </div>
                            ) : (
                              <MarkdownRenderer content={message.text} />
                            )}

                            {/* Grounding Citations */}
                            {message.sources && message.sources.length > 0 && (
                              <div className="mt-4 pt-3 border-t border-neutral-800/60 text-xs">
                                <div className="text-[11px] font-semibold text-neutral-400 mb-2 flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                                  <span>Sources & Web References</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {message.sources.map((source, sIdx) => (
                                    <a
                                      key={sIdx}
                                      href={source.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-950/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition-colors text-[11px] max-w-xs truncate"
                                      title={source.url}
                                    >
                                      <span className="truncate">{source.title}</span>
                                      <ExternalLink className="w-3 h-3 shrink-0 text-neutral-500" />
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Streaming cursor */}
                            {message.isStreaming && (
                              <span className="inline-block w-2 h-4 ml-1 bg-white animate-pulse rounded-xs" />
                            )}
                          </div>
                        )}
                      </div>

                      {/* Message Actions */}
                      <div className="flex items-center gap-1 mt-1.5 text-neutral-400">
                        {isUser ? (
                          <>
                            <button
                              onClick={() => handleCopy(message.id, message.text)}
                              className="p-1.5 rounded-lg hover:bg-neutral-800 hover:text-neutral-200 transition-colors"
                              title="Copy text"
                            >
                              {copiedId === message.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>

                            <button
                              onClick={() => startEdit(idx, message.text)}
                              className="p-1.5 rounded-lg hover:bg-neutral-800 hover:text-neutral-200 transition-colors"
                              title="Edit prompt"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            {/* Copy button */}
                            <button
                              onClick={() => handleCopy(message.id, message.text)}
                              className="p-1.5 rounded-lg hover:bg-neutral-800 hover:text-neutral-200 transition-colors"
                              title="Copy response"
                            >
                              {copiedId === message.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {/* TTS Listen Button */}
                            {ttsSupported && (
                              <button
                                onClick={() => speak(message.id, message.text)}
                                className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                                  speakingId === message.id
                                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                                    : 'hover:bg-neutral-800 hover:text-neutral-200'
                                }`}
                                title={speakingId === message.id ? 'Stop listening' : 'Listen to response'}
                              >
                                {speakingId === message.id ? (
                                  <>
                                    <VolumeX className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
                                    <span className="text-[10px] font-medium hidden sm:inline">Speaking</span>
                                  </>
                                ) : (
                                  <Volume2 className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}

                            {/* Feedback buttons */}
                            <button
                              onClick={() => onFeedback(message.id, 'like')}
                              className="p-1.5 rounded-lg hover:bg-neutral-800 hover:text-neutral-200 transition-colors"
                              title="Good response"
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onFeedback(message.id, 'dislike')}
                              className="p-1.5 rounded-lg hover:bg-neutral-800 hover:text-neutral-200 transition-colors"
                              title="Bad response"
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                            </button>

                            {/* Regenerate button (on last model response) */}
                            {isLastModel && (
                              <button
                                onClick={onRegenerate}
                                className="p-1.5 rounded-lg hover:bg-neutral-800 hover:text-neutral-200 transition-colors flex items-center gap-1 text-xs"
                                title="Regenerate response"
                              >
                                <RotateCw className="w-3.5 h-3.5" />
                                <span className="text-[11px] hidden sm:inline">Regenerate</span>
                              </button>
                            )}
                          </>
                        )}
                      </div>

                      {/* Dynamic Follow-Up Prompt Buttons on last assistant message */}
                      {isLastModel &&
                        !message.isStreaming &&
                        !message.isError &&
                        followUpPrompts.length > 0 && (
                          <FollowUpPromptButtons
                            prompts={followUpPrompts}
                            onSelectPrompt={onSelectPrompt}
                            disabled={isStreaming}
                          />
                        )}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottom && (
        <button
          onClick={scrollToBottom}
          className="fixed bottom-24 right-6 sm:right-10 z-20 p-2.5 rounded-full bg-neutral-900 border border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-800 shadow-xl transition-all animate-in fade-in zoom-in-75 cursor-pointer"
          title="Scroll to bottom"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
