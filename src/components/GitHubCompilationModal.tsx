import React, { useState } from 'react';
import {
  X,
  Github,
  Terminal,
  Cpu,
  Smartphone,
  Copy,
  Check,
  Download,
  ExternalLink,
  GitBranch,
  PlayCircle,
  FileCheck2,
} from 'lucide-react';
import { CappLogo } from './CappLogo';

interface GitHubCompilationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitHubCompilationModal: React.FC<GitHubCompilationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const gitPushScript = `npm run push:github`;

  const manualCommands = `# 1. Initialize git
git init
git branch -M main

# 2. Stage & commit
git add .
git commit -m "feat: complete CAPP AI project"

# 3. Add your GitHub remote and push
git remote add origin https://github.com/YOUR_USERNAME/capp-ai.git
git push -u origin main`;

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden text-neutral-100">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-neutral-800 text-white border border-neutral-700">
              <Github className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                Compile App Using GitHub Actions
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  Cloud CI/CD
                </span>
              </h3>
              <p className="text-xs text-neutral-400">
                Push to GitHub to compile Web assets and Android APKs automatically
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {/* Overview Banner */}
          <div className="p-3.5 rounded-2xl bg-neutral-950/80 border border-neutral-800 text-neutral-300 flex items-start gap-3">
            <Cpu className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold text-white text-xs">
                No third-party builder needed
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Your repository contains pre-configured GitHub Actions workflows in{' '}
                <code className="px-1.5 py-0.5 rounded bg-neutral-800 text-sky-300 font-mono text-[11px]">
                  .github/workflows/
                </code>
                . When you push to GitHub, GitHub runners automatically build the web app and compile the Android APK.
              </p>
            </div>
          </div>

          {/* Workflow Cards */}
          <div>
            <div className="text-xs font-semibold text-neutral-400 mb-2.5 flex items-center gap-1.5">
              <PlayCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Configured GitHub Actions Workflows</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white text-xs flex items-center gap-1.5">
                    <FileCheck2 className="w-3.5 h-3.5 text-sky-400" />
                    Web Build & Typecheck
                  </span>
                  <span className="text-[10px] text-neutral-500 font-mono">compile-app.yml</span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Lints TypeScript, generates high-res PNG icons, compiles production bundle, and archives zip.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white text-xs flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                    Android APK Compilation
                  </span>
                  <span className="text-[10px] text-neutral-500 font-mono">compile-android-apk.yml</span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Compiles standalone Android TWA APK via Java 17 and Android SDK on GitHub runners.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Push Command */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-400 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-amber-400" />
                <span>One-Command Push Script</span>
              </span>
              <button
                onClick={() => copyToClipboard(gitPushScript, 1)}
                className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 font-medium"
              >
                {copiedIndex === 1 ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Command</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 font-mono text-xs text-emerald-300 overflow-x-auto">
              <code>{gitPushScript}</code>
            </pre>
          </div>

          {/* Manual Git Push Instructions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-400 flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
                <span>Manual Git Commands</span>
              </span>
              <button
                onClick={() => copyToClipboard(manualCommands, 2)}
                className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 font-medium"
              >
                {copiedIndex === 2 ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy All</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 font-mono text-xs text-neutral-300 overflow-x-auto leading-relaxed">
              <code>{manualCommands}</code>
            </pre>
          </div>

          {/* Download Artifacts Instructions */}
          <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80 text-xs text-neutral-400 space-y-1">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>Where to download your compiled app:</span>
            </div>
            <p>
              Once pushed, visit your repo's <strong>Actions</strong> tab on GitHub, click on the completed run, and download your compiled APK and web packages under <strong>Artifacts</strong>.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between">
          <a
            href="/capp-ai-project.zip"
            download="capp-ai-project.zip"
            className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-medium"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Project ZIP</span>
          </a>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
