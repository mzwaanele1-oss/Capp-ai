import React, { useState, useRef } from 'react';
import {
  X,
  Sparkles,
  Upload,
  Image as ImageIcon,
  Check,
  Copy,
  ArrowRight,
  MessageSquare,
  Wand2,
  AlertCircle,
} from 'lucide-react';
import { aiService } from '../services/aiService';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useAndroidBackNavigation } from '../hooks/useAndroidBackNavigation';
import { logToolUsage } from '../utils/usageTracking';

interface ImageStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat: (text: string, imageAttachment?: { mimeType: string; data: string; name: string }) => void;
}

const STUDIO_TASKS = [
  { id: 'describe', name: 'Describe & Critique', desc: 'Detailed composition, lighting, style, and visual narrative.' },
  { id: 'enhance', name: 'Enhance Blueprint', desc: 'Pro photographer recommendations for framing and color balance.' },
  { id: 'pencil', name: 'Pencil Sketch Concept', desc: 'Graphite shading map, line weight, and architectural drafting.' },
  { id: 'anime', name: 'Anime / Ghibli Style', desc: 'Cinematic cel-shading, vibrant lighting, and painterly look.' },
  { id: 'bw', name: 'Black & White Fine Art', desc: 'Ansel Adams monochrome tonal zones and deep contrast.' },
  { id: 'poster', name: 'Minimalist Poster Art', desc: 'Graphic design hierarchy, bold geometry, and Swiss typography.' },
  { id: 'tshirt', name: 'T-Shirt & Apparel Print', desc: 'Streetwear vector separation and merchandise print specs.' },
  { id: 'remove_bg', name: 'Subject Isolation & BG', desc: 'Subject extraction contours and recommended minimalist backdrops.' },
];

export const ImageStudioModal: React.FC<ImageStudioModalProps> = ({
  isOpen,
  onClose,
  onSendToChat,
}) => {
  useAndroidBackNavigation(isOpen, onClose);

  const [selectedTask, setSelectedTask] = useState('describe');
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState('image/png');
  const [imageName, setImageName] = useState('uploaded-image.png');
  const [customNote, setCustomNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageName(file.name);
    setImageMime(file.type);
    const reader = new FileReader();
    reader.onload = () => {
      setImageDataUrl(reader.result as string);
      setResult(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleProcess = async () => {
    if (!imageDataUrl) return;
    setIsProcessing(true);
    setError(null);
    setResult(null);

    const res = await aiService.runImageStudio({
      image: {
        mimeType: imageMime,
        data: imageDataUrl,
      },
      task: selectedTask,
      customPrompt: customNote.trim() || undefined,
    });

    setIsProcessing(false);
    if (res.success) {
      setResult(res.result);
      logToolUsage('image_studio', { task: selectedTask });
    } else {
      setError(res.error || 'Failed to process image studio request.');
    }
  };

  const handleSendResultToChat = () => {
    if (!result) return;
    const taskName = STUDIO_TASKS.find((t) => t.id === selectedTask)?.name || 'Image Studio';
    const message = `Here is the ${taskName} analysis and creative blueprint:\n\n${result}`;
    onSendToChat(
      message,
      imageDataUrl
        ? {
            mimeType: imageMime,
            data: imageDataUrl,
            name: imageName,
          }
        : undefined
    );
    onClose();
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl h-[90vh] max-h-[700px] flex flex-col rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden text-neutral-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">CAPP AI Image Studio</h2>
              <p className="text-xs text-neutral-400">
                Visual intelligence, aesthetic reimagination, and creative blueprints
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-850 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice on Real Capabilities */}
        <div className="px-6 py-2 bg-neutral-950/80 border-b border-neutral-850 flex items-center gap-2 text-xs text-neutral-400">
          <AlertCircle className="w-4 h-4 text-neutral-400 shrink-0" />
          <span>
            Transforms are generated as comprehensive artistic blueprints and visual analyses via Gemini 3.8 Vision.
          </span>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Controls & Upload (Left) */}
          <div className="w-full md:w-80 flex flex-col p-4 border-b md:border-b-0 md:border-r border-neutral-800 overflow-y-auto bg-neutral-950/40 space-y-4">
            {/* Upload Area */}
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              {imageDataUrl ? (
                <div className="relative rounded-2xl overflow-hidden border border-neutral-750 group">
                  <img
                    src={imageDataUrl}
                    alt="Preview"
                    className="w-full h-44 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-neutral-800 text-white text-xs font-medium border border-neutral-700"
                    >
                      Change Photo
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-44 rounded-2xl border-2 border-dashed border-neutral-800 hover:border-neutral-600 bg-neutral-900/40 hover:bg-neutral-900/80 cursor-pointer flex flex-col items-center justify-center p-4 text-center transition-all"
                >
                  <Upload className="w-8 h-8 text-neutral-500 mb-2" />
                  <span className="text-xs font-semibold text-neutral-300">Upload Image</span>
                  <span className="text-[10px] text-neutral-500 mt-1">PNG, JPG, or WEBP up to 20MB</span>
                </div>
              )}
            </div>

            {/* Task Selector */}
            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                Choose Creative Direction
              </label>
              <div className="space-y-1.5">
                {STUDIO_TASKS.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => setSelectedTask(task.id)}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all ${
                      selectedTask === task.id
                        ? 'border-white bg-neutral-850 text-white shadow-xs'
                        : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <div className="font-semibold text-xs text-neutral-200">{task.name}</div>
                    <div className="text-[10px] text-neutral-500 leading-snug">{task.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom guidance */}
            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                Specific Guidance (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g., Focus on futuristic neon cyberpunk elements..."
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-neutral-600"
              />
            </div>

            {/* Action button */}
            <button
              onClick={handleProcess}
              disabled={!imageDataUrl || isProcessing}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-neutral-950 font-semibold text-xs shadow-md transition-all disabled:opacity-40"
            >
              {isProcessing ? (
                <span className="animate-pulse">Processing with Vision AI...</span>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Blueprint</span>
                </>
              )}
            </button>
          </div>

          {/* Results Output (Right) */}
          <div className="flex-1 flex flex-col p-6 overflow-y-auto bg-neutral-900">
            {isProcessing ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
                <div className="w-10 h-10 rounded-full border-2 border-neutral-700 border-t-white animate-spin" />
                <div className="text-sm font-semibold text-white">Analyzing with Gemini Vision</div>
                <div className="text-xs text-neutral-500 max-w-xs">
                  Generating deep structural breakdown, lighting analysis, and concept specifications...
                </div>
              </div>
            ) : error ? (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                <div className="font-semibold text-sm mb-1">Processing Error</div>
                <div>{error}</div>
              </div>
            ) : result ? (
              <div className="flex flex-col h-full justify-between space-y-4">
                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                    <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                      Studio Blueprint
                    </span>
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white transition-colors"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <MarkdownRenderer content={result} />
                </div>

                <div className="pt-3 border-t border-neutral-800 flex items-center justify-end gap-2">
                  <button
                    onClick={handleSendResultToChat}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-neutral-950 font-semibold text-xs hover:bg-neutral-200 transition-colors shadow-sm"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Continue in Main Chat</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-neutral-500">
                <ImageIcon className="w-10 h-10 mb-2 text-neutral-600" />
                <span className="text-xs font-medium">
                  Upload an image on the left and click "Generate Blueprint" to begin.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
