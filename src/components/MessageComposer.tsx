import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Send,
  Square,
  Mic,
  MicOff,
  Plus,
  Image as ImageIcon,
  Camera,
  FileText,
  Sparkles,
  Wand2,
  X,
  AlertCircle,
  Volume2,
  Radio,
} from 'lucide-react';
import { Attachment } from '../types';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

interface MessageComposerProps {
  onSendMessage: (text: string, attachments: Attachment[]) => void;
  onStopGeneration: () => void;
  isGenerating: boolean;
  onOpenImageStudio: () => void;
  onOpenTools: () => void;
  initialText?: string;
  onTypingStateChange?: (isTyping: boolean) => void;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  onSendMessage,
  onStopGeneration,
  isGenerating,
  onOpenImageStudio,
  onOpenTools,
  initialText = '',
  onTypingStateChange,
}) => {
  const [text, setText] = useState(initialText);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  // Web Speech API Voice-to-Text via custom useSpeechRecognition hook
  const baseTextRef = useRef('');

  const {
    isListening,
    interimTranscript,
    isSupported: speechSupported,
    error: speechError,
    toggleListening: toggleSpeechListening,
    stopListening,
    resetTranscript,
    clearError: clearSpeechError,
  } = useSpeechRecognition({
    onTranscriptChange: (combinedText) => {
      setText(combinedText);
      onTypingStateChange?.(Boolean(combinedText.trim()));
    },
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync initialText if provided (e.g. from suggested prompt or edit)
  useEffect(() => {
    if (initialText) {
      setText(initialText);
      textareaRef.current?.focus();
    }
  }, [initialText]);

  // Auto-resize textarea & maintain scroll position during voice transcription
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(Math.max(scrollHeight, 44), 160)}px`;
      if (isListening) {
        textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
      }
    }
  }, [text, isListening]);

  // Toggle Voice-to-Text Dictation
  const handleToggleListening = useCallback(() => {
    if (!speechSupported) {
      return;
    }
    if (!isListening) {
      baseTextRef.current = text.trim();
      textareaRef.current?.focus();
      toggleSpeechListening(text.trim());
    } else {
      toggleSpeechListening();
    }
  }, [speechSupported, isListening, text, toggleSpeechListening]);

  // Clear live voice dictation
  const handleClearSpeech = useCallback(() => {
    setText(baseTextRef.current);
    resetTranscript();
  }, [resetTranscript]);

  // Send message
  const handleSend = () => {
    if ((!text.trim() && attachments.length === 0) || isGenerating) return;

    // Stop microphone if currently listening
    stopListening();

    onSendMessage(text.trim(), attachments);
    setText('');
    setAttachments([]);
    resetTranscript();
    baseTextRef.current = '';

    if (textareaRef.current) {
      textareaRef.current.style.height = '44px';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Image compression helper for mobile
  const processImageFile = async (file: File): Promise<{ dataUrl: string; size: number }> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;

        // If file is already small (< 1.2MB), no need to compress
        if (file.size < 1.2 * 1024 * 1024) {
          resolve({ dataUrl, size: file.size });
          return;
        }

        // Downscale on offscreen canvas for mobile efficiency
        const img = new Image();
        img.onload = () => {
          const maxDim = 1600;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.82);
            resolve({ dataUrl: compressed, size: Math.round(compressed.length * 0.75) });
          } else {
            resolve({ dataUrl, size: file.size });
          }
        };
        img.onerror = () => resolve({ dataUrl, size: file.size });
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle Image Upload & Camera Capture
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        setFileError("Sorry, CAPP AI can't process this file type yet.");
        setTimeout(() => setFileError(null), 4000);
        continue;
      }

      const { dataUrl, size } = await processImageFile(file);
      setAttachments((prev) => [
        ...prev,
        {
          id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          name: file.name || 'camera_photo.jpg',
          type: 'image',
          mimeType: 'image/jpeg',
          size,
          data: dataUrl,
          previewUrl: dataUrl,
        },
      ]);
    }
    e.target.value = '';
    setPlusMenuOpen(false);
  };

  // Handle Document Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const allowedExtensions = ['.pdf', '.txt', '.csv', '.json', '.md', '.doc', '.docx', '.js', '.ts', '.html', '.css', '.py'];

    Array.from(files).forEach((file) => {
      const lowerName = file.name.toLowerCase();
      const isAllowed = allowedExtensions.some((ext) => lowerName.endsWith(ext)) || file.type.includes('text') || file.type.includes('pdf');

      if (!isAllowed) {
        setFileError("Sorry, CAPP AI can't process this file type yet.");
        setTimeout(() => setFileError(null), 4500);
        return;
      }

      const isTextual =
        file.type.includes('text') ||
        file.type.includes('json') ||
        file.type.includes('csv') ||
        lowerName.endsWith('.txt') ||
        lowerName.endsWith('.csv') ||
        lowerName.endsWith('.md') ||
        lowerName.endsWith('.json') ||
        lowerName.endsWith('.js') ||
        lowerName.endsWith('.ts');

      const reader = new FileReader();
      if (isTextual) {
        reader.onload = () => {
          const content = reader.result as string;
          setAttachments((prev) => [
            ...prev,
            {
              id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
              name: file.name,
              type: 'file',
              mimeType: file.type || 'text/plain',
              size: file.size,
              data: `Attachment [${file.name}]:\n\`\`\`\n${content}\n\`\`\``,
            },
          ]);
        };
        reader.readAsText(file);
      } else {
        reader.onload = () => {
          const base64Data = reader.result as string;
          setAttachments((prev) => [
            ...prev,
            {
              id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
              name: file.name,
              type: 'file',
              mimeType: file.type || 'application/octet-stream',
              size: file.size,
              data: base64Data,
            },
          ]);
        };
        reader.readAsDataURL(file);
      }
    });
    e.target.value = '';
    setPlusMenuOpen(false);
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div
      className="relative w-full max-w-4xl mx-auto px-3 sm:px-6 pt-1"
      style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))' }}
    >
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={imageInputRef}
        onChange={handleImageChange}
        accept="image/png, image/jpeg, image/webp, image/gif"
        multiple
        className="hidden"
      />
      {/* Android Native Camera Capture */}
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleImageChange}
        accept="image/*"
        capture="environment"
        className="hidden"
      />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.txt,.csv,.doc,.docx,.json,.md,.js,.ts,.py"
        multiple
        className="hidden"
      />

      {/* Speech Recognition Error Banner */}
      {speechError && (
        <div className="flex items-center gap-2 px-3.5 py-2 mb-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs shadow-md animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
          <span className="flex-1 font-medium">{speechError}</span>
          <button
            onClick={clearSpeechError}
            className="text-neutral-400 hover:text-white p-0.5"
            aria-label="Dismiss speech error"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* File type or upload error toast */}
      {fileError && (
        <div className="flex items-center gap-2 px-3 py-1.5 mb-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs animate-fade-in shadow-md">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span className="flex-1">{fileError}</span>
          <button
            onClick={() => setFileError(null)}
            className="text-neutral-400 hover:text-white p-0.5"
            aria-label="Dismiss file error"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Hands-Free Active Voice-to-Text Status Banner */}
      {isListening && (
        <div className="flex items-center justify-between gap-3 px-3.5 py-2 mb-2 rounded-2xl bg-neutral-900/95 border border-red-500/30 shadow-lg text-xs backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>

            {/* Simulated Animated Sound Wave Bars */}
            <div className="flex items-center gap-0.5 h-3.5 shrink-0">
              <span className="w-0.5 h-2 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
              <span className="w-0.5 h-3.5 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
              <span className="w-0.5 h-1.5 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
              <span className="w-0.5 h-3 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: '450ms' }} />
            </div>

            <div className="min-w-0 flex-1 truncate">
              <span className="font-semibold text-red-300 mr-1.5">Listening:</span>
              <span className="text-neutral-300 italic">
                {interimTranscript ? `"${interimTranscript}"` : 'Speak into your microphone...'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {text.trim() && (
              <button
                type="button"
                onClick={handleClearSpeech}
                className="px-2 py-1 rounded-lg text-[11px] text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
              >
                Clear
              </button>
            )}

            <button
              type="button"
              onClick={stopListening}
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition"
            >
              Done
            </button>

            <button
              type="button"
              onClick={handleSend}
              disabled={!text.trim()}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-red-500 hover:bg-red-400 text-white shadow-sm transition disabled:opacity-40"
            >
              <Send className="w-3 h-3" />
              <span>Send</span>
            </button>
          </div>
        </div>
      )}

      {/* Attachments preview row */}
      {attachments.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-1 px-1">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="relative group shrink-0 flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-300"
            >
              {att.type === 'image' && att.previewUrl ? (
                <img
                  src={att.previewUrl}
                  alt={att.name}
                  className="w-8 h-8 rounded-lg object-cover border border-neutral-700"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-400">
                  <FileText className="w-4 h-4" />
                </div>
              )}
              <div className="max-w-[120px] truncate">
                <div className="font-medium truncate text-neutral-200">{att.name}</div>
                <div className="text-[10px] text-neutral-500">
                  {(att.size / 1024).toFixed(0)} KB
                </div>
              </div>
              <button
                onClick={() => removeAttachment(att.id)}
                className="ml-1 p-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                title="Remove attachment"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Composer Box */}
      <div className={`relative flex items-end gap-1.5 p-1.5 sm:p-2 rounded-2xl bg-neutral-900/95 border transition-all backdrop-blur-md shadow-xl ${
        isListening
          ? 'border-red-500/50 ring-1 ring-red-500/20'
          : 'border-neutral-800 focus-within:border-neutral-700'
      }`}>
        {/* Plus Action Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setPlusMenuOpen(!plusMenuOpen)}
            className={`p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all ${
              plusMenuOpen ? 'rotate-45 bg-neutral-800 text-white' : ''
            }`}
            title="Add attachments or open tools"
          >
            <Plus className="w-5 h-5" />
          </button>

          {/* Plus popup menu */}
          {plusMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setPlusMenuOpen(false)}
              />
              <div className="absolute bottom-12 left-0 z-40 w-52 rounded-2xl bg-neutral-900 border border-neutral-750 shadow-2xl p-1.5 space-y-0.5 text-xs text-neutral-200 animate-in fade-in zoom-in-95 duration-150">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-neutral-800 text-left transition-colors"
                >
                  <Camera className="w-4 h-4 text-sky-400" />
                  <div>
                    <div className="font-medium">Take Photo</div>
                    <div className="text-[10px] text-neutral-500">Device camera capture</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-neutral-800 text-left transition-colors"
                >
                  <ImageIcon className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="font-medium">Upload Image</div>
                    <div className="text-[10px] text-neutral-500">Photos from gallery</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-neutral-800 text-left transition-colors"
                >
                  <FileText className="w-4 h-4 text-blue-400" />
                  <div>
                    <div className="font-medium">Upload Document</div>
                    <div className="text-[10px] text-neutral-500">PDF, TXT, CSV, Docs</div>
                  </div>
                </button>

                <div className="my-1 border-t border-neutral-800" />

                <button
                  type="button"
                  onClick={() => {
                    setPlusMenuOpen(false);
                    onOpenImageStudio();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-neutral-800 text-left transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="font-medium">Image Studio</div>
                    <div className="text-[10px] text-neutral-500">AI art & photo redesign</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPlusMenuOpen(false);
                    onOpenTools();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-neutral-800 text-left transition-colors"
                >
                  <Wand2 className="w-4 h-4 text-purple-400" />
                  <div>
                    <div className="font-medium">Creative & Code Tools</div>
                    <div className="text-[10px] text-neutral-500">Writing, coding, productivity</div>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Text Input Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            onTypingStateChange?.(Boolean(e.target.value.trim()));
          }}
          onKeyDown={handleKeyDown}
          placeholder={
            isListening ? 'Listening hands-free... speak now...' : 'Message CAPP AI...'
          }
          rows={1}
          className="flex-1 max-h-40 min-h-[44px] py-2.5 px-2 bg-transparent text-sm sm:text-base text-neutral-100 placeholder-neutral-500 resize-none focus:outline-hidden leading-relaxed"
        />

        {/* Microphone Button (Web Speech API Voice-to-Text via useSpeechRecognition) */}
        <button
          type="button"
          onClick={handleToggleListening}
          className={`p-2 rounded-xl transition-all relative flex items-center justify-center ${
            isListening
              ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/40 shadow-inner'
              : speechSupported
              ? 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              : 'text-neutral-600 hover:text-neutral-500'
          }`}
          title={
            isListening
              ? 'Stop voice dictation'
              : speechSupported
              ? 'Voice-to-text input (Web Speech API)'
              : 'Web Speech API not supported in this browser'
          }
          aria-label={isListening ? 'Stop listening' : 'Start voice dictation'}
        >
          {isListening ? (
            <>
              <MicOff className="w-5 h-5 text-red-400 animate-pulse" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-neutral-900" />
            </>
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </button>

        {/* Send / Stop Generation Button */}
        {isGenerating ? (
          <button
            type="button"
            onClick={onStopGeneration}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition-all flex items-center justify-center"
            title="Stop generating"
          >
            <Square className="w-5 h-5 fill-current" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSend}
            disabled={!text.trim() && attachments.length === 0}
            className="p-2 rounded-xl bg-neutral-100 hover:bg-white text-neutral-950 disabled:opacity-30 disabled:hover:bg-neutral-100 shadow-sm transition-all flex items-center justify-center"
            title="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Subtle branding footer note */}
      <div className="flex items-center justify-center gap-1.5 mt-1.5 text-[11px] text-neutral-500 font-normal">
        <span>CAPP AI can make mistakes. Verify important information.</span>
      </div>
    </div>
  );
};
