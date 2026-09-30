import React, { useState } from 'react';
import { X, Copy, Check, Download, Share2, FileText } from 'lucide-react';
import { Conversation } from '../types';
import { exportConversationToPdf } from '../utils/exportConversationToPdf';
import { useAndroidBackNavigation } from '../hooks/useAndroidBackNavigation';
import { logToolUsage } from '../utils/usageTracking';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation | null;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  conversation,
}) => {
  useAndroidBackNavigation(isOpen, onClose);
  const [copied, setCopied] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);

  if (!isOpen || !conversation) return null;

  const generateMarkdown = () => {
    let md = `# ${conversation.title || 'CAPP AI Conversation'}\n\n`;
    md += `*Generated with CAPP AI — Think smarter. Create more.*\n\n---\n\n`;

    conversation.messages.forEach((m) => {
      const sender = m.role === 'user' ? '**User**' : '**CAPP AI**';
      md += `### ${sender}\n\n${m.text}\n\n`;
      if (m.sources && m.sources.length > 0) {
        md += `**Sources:**\n`;
        m.sources.forEach((s) => {
          md += `- [${s.title}](${s.url})\n`;
        });
        md += `\n`;
      }
    });

    return md;
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(generateMarkdown());
    logToolUsage('markdown_export');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const md = generateMarkdown();
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${conversation.title.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'capp-ai-chat'}.md`;
    a.click();
    URL.revokeObjectURL(url);
    logToolUsage('markdown_export');
  };

  const handleDownloadPdf = async () => {
    if (!conversation || isExportingPdf) return;
    try {
      setIsExportingPdf(true);
      await exportConversationToPdf(conversation);
      logToolUsage('pdf_export');
      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to export conversation as PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl p-6 text-neutral-100">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-neutral-300" />
            <h3 className="font-bold text-base text-white">Share Conversation</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-3">
          <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800">
            <div className="text-xs text-neutral-400 mb-0.5">Conversation Title</div>
            <div className="text-sm font-semibold text-white truncate">{conversation.title}</div>
            <div className="text-[11px] text-neutral-500 mt-1">
              {conversation.messages.length} messages
            </div>
          </div>

          <p className="text-xs text-neutral-400 leading-relaxed">
            Export this conversation with complete Markdown formatting, styled code blocks, and research citations.
          </p>

          <div className="space-y-2 pt-2">
            {/* Primary Download as PDF Button */}
            <button
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-neutral-950 text-xs font-bold transition-all shadow-md active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              {isExportingPdf ? (
                <>
                  <div className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                  <span>Generating PDF document...</span>
                </>
              ) : pdfSuccess ? (
                <>
                  <Check className="w-4 h-4 text-neutral-950" />
                  <span>PDF Downloaded!</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 text-neutral-950" />
                  <span>Download as PDF</span>
                </>
              )}
            </button>

            {/* Markdown Export Options */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleCopyMarkdown}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-white text-xs font-semibold border border-neutral-700 transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Markdown</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadMarkdown}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-neutral-850 hover:bg-neutral-800 text-neutral-200 hover:text-white border border-neutral-750 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download .md</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
