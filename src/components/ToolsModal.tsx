import React, { useState } from 'react';
import {
  X,
  Wand2,
  PenTool,
  Sparkles,
  CheckSquare,
  Code2,
  ArrowRight,
  BookOpen,
  Send,
} from 'lucide-react';
import { CreativeTool } from '../types';
import { useAndroidBackNavigation } from '../hooks/useAndroidBackNavigation';
import { logToolUsage } from '../utils/usageTracking';

interface ToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyToolPrompt: (prompt: string) => void;
}

const CREATIVE_TOOLS: CreativeTool[] = [
  // Writing
  {
    id: 'rewrite',
    category: 'writing',
    name: 'Rewrite & Polish',
    description: 'Elevate phrasing, flow, and elegance while preserving original intent.',
    icon: 'PenTool',
    inputPlaceholder: 'Paste text you want to rewrite with higher impact...',
    promptTemplate: 'Please rewrite and polish the following text for maximum clarity, eloquence, and impact:\n\n{input}',
  },
  {
    id: 'proofread',
    category: 'writing',
    name: 'Grammar & Proofread',
    description: 'Fix grammatical errors, punctuation, awkward phrasing, and flow.',
    icon: 'PenTool',
    inputPlaceholder: 'Paste text to proofread and correct...',
    promptTemplate: 'Proofread and correct the following text. Highlight key corrections and provide the improved pristine version:\n\n{input}',
  },
  {
    id: 'summarize',
    category: 'writing',
    name: 'Executive Summary',
    description: 'Distill articles, documents, or notes into actionable takeaways.',
    icon: 'PenTool',
    inputPlaceholder: 'Paste lengthy text or report to summarize...',
    promptTemplate: 'Provide an executive summary of the following content with 3-5 bullet points of key takeaways and actionable insights:\n\n{input}',
  },
  {
    id: 'expand',
    category: 'writing',
    name: 'Elaborate & Expand',
    description: 'Enrich an outline or brief thought with vivid details and depth.',
    icon: 'PenTool',
    inputPlaceholder: 'Enter a concise point or concept to expand in detail...',
    promptTemplate: 'Expand the following concept into a well-structured, thorough, and engaging analysis:\n\n{input}',
  },
  {
    id: 'shorten',
    category: 'writing',
    name: 'Condense & Tighten',
    description: 'Cut filler words while keeping core impact and punchiness.',
    icon: 'PenTool',
    inputPlaceholder: 'Paste text you need shortened...',
    promptTemplate: 'Condense the following text to be concise, punchy, and under 50% length without losing vital meaning:\n\n{input}',
  },
  {
    id: 'tone',
    category: 'writing',
    name: 'Change Tone',
    description: 'Shift tone to formal, persuasive, friendly, humorous, or academic.',
    icon: 'PenTool',
    inputPlaceholder: 'Specify tone (e.g. Formal, C-level, Friendly) and text...',
    promptTemplate: 'Rewrite the following text with the specified tone, maintaining all factual accuracy:\n\n{input}',
  },
  {
    id: 'translate',
    category: 'writing',
    name: 'Contextual Translator',
    description: 'Nuanced multilingual translation honoring cultural idioms.',
    icon: 'PenTool',
    inputPlaceholder: 'Enter target language and text to translate...',
    promptTemplate: 'Translate the following text into the target language with natural conversational flow and proper idioms:\n\n{input}',
  },

  // Creative
  {
    id: 'story',
    category: 'creative',
    name: 'Story Generator',
    description: 'Craft immersive fiction with rich narrative arcs and dialogue.',
    icon: 'Sparkles',
    inputPlaceholder: 'Premise, genre, characters, or mood...',
    promptTemplate: 'Write an immersive, atmospheric short story based on this premise:\n\n{input}',
  },
  {
    id: 'poetry',
    category: 'creative',
    name: 'Poetry & Verse',
    description: 'Compose poignant poems, haikus, or rhythmic sonnets.',
    icon: 'Sparkles',
    inputPlaceholder: 'Theme, style (e.g. Free verse, Sonnet), and imagery...',
    promptTemplate: 'Write an evocative poem exploring this theme with striking visual imagery:\n\n{input}',
  },
  {
    id: 'lyrics',
    category: 'creative',
    name: 'Song Lyrics',
    description: 'Write verses, hooks, and choruses across any musical genre.',
    icon: 'Sparkles',
    inputPlaceholder: 'Musical genre, tempo, theme, and emotion...',
    promptTemplate: 'Compose catchy, emotionally resonant song lyrics with Verse, Chorus, Verse, Bridge, and Outro structure for:\n\n{input}',
  },
  {
    id: 'social',
    category: 'creative',
    name: 'Social Media Hooks & Captions',
    description: 'Viral hooks, Twitter/X threads, LinkedIn posts, and Instagram captions.',
    icon: 'Sparkles',
    inputPlaceholder: 'Topic, target audience, and platform...',
    promptTemplate: 'Create 5 high-converting social media posts/captions with attention-grabbing hooks, concise insights, and relevant hashtags for:\n\n{input}',
  },
  {
    id: 'brainstorm',
    category: 'creative',
    name: 'Ideation & Brainstorming',
    description: 'Explore divergent angles and unconventional possibilities.',
    icon: 'Sparkles',
    inputPlaceholder: 'Problem space, industry, or creative challenge...',
    promptTemplate: 'Brainstorm 8 innovative, non-obvious ideas for this challenge, including pros, cons, and unfair advantages:\n\n{input}',
  },
  {
    id: 'name',
    category: 'creative',
    name: 'Brand & Product Names',
    description: 'Generate memorable, punchy names with domain availability logic.',
    icon: 'Sparkles',
    inputPlaceholder: 'Product description, target audience, brand tone...',
    promptTemplate: 'Generate 12 distinctive, memorable brand/project names categorized into Modern/Tech, Evocative, and Minimalist styles for:\n\n{input}',
  },

  // Productivity
  {
    id: 'todo',
    category: 'productivity',
    name: 'Actionable To-Do List',
    description: 'Deconstruct complex goals into prioritized bite-sized checklists.',
    icon: 'CheckSquare',
    inputPlaceholder: 'Goal or project you want to break down...',
    promptTemplate: 'Break down this goal into a prioritized, actionable step-by-step checklist with estimated timeframes:\n\n{input}',
  },
  {
    id: 'study',
    category: 'productivity',
    name: 'Accelerated Study Plan',
    description: 'Spaced repetition schedule and milestone roadmap.',
    icon: 'CheckSquare',
    inputPlaceholder: 'Subject, exam date, or skill you want to master...',
    promptTemplate: 'Design a structured 4-week accelerated study roadmap using active recall and spaced repetition for:\n\n{input}',
  },
  {
    id: 'project',
    category: 'productivity',
    name: 'Project Blueprint',
    description: 'Phases, milestones, risk matrix, and resource requirements.',
    icon: 'CheckSquare',
    inputPlaceholder: 'Project scope, deliverables, and deadline...',
    promptTemplate: 'Create a comprehensive project plan blueprint with phases, deliverables, risks, and mitigation strategies for:\n\n{input}',
  },
  {
    id: 'email',
    category: 'productivity',
    name: 'Executive Email Drafter',
    description: 'Cold outreach, follow-ups, negotiations, or client responses.',
    icon: 'CheckSquare',
    inputPlaceholder: 'Recipient, goal of email, tone, and key points...',
    promptTemplate: 'Draft a polished, professional email that achieves this objective with a clear subject line and call-to-action:\n\n{input}',
  },
  {
    id: 'resume',
    category: 'productivity',
    name: 'Resume & CV Enhancer',
    description: 'Transform passive job descriptions into metric-driven achievements.',
    icon: 'CheckSquare',
    inputPlaceholder: 'Paste bullet points or work experience to improve...',
    promptTemplate: 'Rewrite the following resume bullet points using the Google XYZ formula (Accomplished [X] as measured by [Y], by doing [Z]):\n\n{input}',
  },

  // Coding
  {
    id: 'code-explain',
    category: 'coding',
    name: 'Explain Code',
    description: 'Line-by-line breakdown, algorithmic complexity, and architecture.',
    icon: 'Code2',
    inputPlaceholder: 'Paste code snippet or function to analyze...',
    promptTemplate: 'Explain this code in detail: explain the algorithm, time/space complexity (Big-O), and architectural design:\n\n```\n{input}\n```',
  },
  {
    id: 'code-generate',
    category: 'coding',
    name: 'Generate Full Feature',
    description: 'Write production-ready, typed, and idiomatic code implementations.',
    icon: 'Code2',
    inputPlaceholder: 'Feature specification, language/framework, constraints...',
    promptTemplate: 'Write clean, robust, typed code that solves this requirement with comments and error handling:\n\n{input}',
  },
  {
    id: 'code-debug',
    category: 'coding',
    name: 'Debug & Fix Errors',
    description: 'Identify root cause, stack trace flaws, and propose reliable fix.',
    icon: 'Code2',
    inputPlaceholder: 'Paste buggy code and error message/behavior...',
    promptTemplate: 'Diagnose this bug, explain why it occurred, and provide the tested corrected code fix:\n\n{input}',
  },
  {
    id: 'code-refactor',
    category: 'coding',
    name: 'Refactor for Performance & Clean Code',
    description: 'Optimize readability, reduce redundancy, and enhance speed.',
    icon: 'Code2',
    inputPlaceholder: 'Paste code to refactor...',
    promptTemplate: 'Refactor this code to follow SOLID principles, improve readability, eliminate code smells, and optimize performance:\n\n```\n{input}\n```',
  },
  {
    id: 'code-doc',
    category: 'coding',
    name: 'Generate Documentation & Tests',
    description: 'TSDoc/JSDoc comments, API documentation, and unit tests.',
    icon: 'Code2',
    inputPlaceholder: 'Paste function, class, or API route...',
    promptTemplate: 'Generate comprehensive documentation (TSDoc/JSDoc) and unit test test-cases for the following code:\n\n```\n{input}\n```',
  },
];

export const ToolsModal: React.FC<ToolsModalProps> = ({
  isOpen,
  onClose,
  onApplyToolPrompt,
}) => {
  useAndroidBackNavigation(isOpen, onClose);

  const [selectedCategory, setSelectedCategory] = useState<
    'all' | 'writing' | 'creative' | 'productivity' | 'coding'
  >('all');
  const [activeTool, setActiveTool] = useState<CreativeTool | null>(null);
  const [toolInput, setToolInput] = useState('');

  if (!isOpen) return null;

  const filteredTools =
    selectedCategory === 'all'
      ? CREATIVE_TOOLS
      : CREATIVE_TOOLS.filter((t) => t.category === selectedCategory);

  const handleRunTool = () => {
    if (!activeTool) return;
    const finalPrompt = activeTool.promptTemplate.replace('{input}', toolInput.trim() || '(Please proceed with best practices)');
    logToolUsage('creative_tool', { toolId: activeTool.id, toolName: activeTool.name });
    onApplyToolPrompt(finalPrompt);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl h-[85vh] max-h-[660px] flex flex-col rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden text-neutral-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-neutral-850 text-white border border-neutral-750">
              <Wand2 className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">CAPP AI Creative & Coding Studio</h2>
              <p className="text-xs text-neutral-400">
                Specialized cognitive prompts tailored for professional workflows
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

        {/* Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Tool Directory (Left) */}
          <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-neutral-800 overflow-hidden bg-neutral-950/60">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-3 overflow-x-auto border-b border-neutral-850">
              {(
                [
                  { id: 'all', label: 'All Tools' },
                  { id: 'writing', label: 'Writing' },
                  { id: 'creative', label: 'Creative' },
                  { id: 'productivity', label: 'Productivity' },
                  { id: 'coding', label: 'Coding' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-colors ${
                    selectedCategory === tab.id
                      ? 'bg-neutral-100 text-neutral-950 font-semibold'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredTools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => {
                    setActiveTool(tool);
                    setToolInput('');
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    activeTool?.id === tool.id
                      ? 'border-white bg-neutral-800 shadow-md'
                      : 'border-neutral-800/80 bg-neutral-900/60 hover:bg-neutral-850 hover:border-neutral-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs text-neutral-100">
                        {tool.name}
                      </span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700/60">
                        {tool.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-snug line-clamp-2">
                      {tool.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Tool Runner (Right) */}
          <div className="w-full md:w-96 flex flex-col bg-neutral-900 p-5 overflow-y-auto">
            {activeTool ? (
              <div className="flex flex-col h-full justify-between space-y-4">
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-neutral-500 tracking-wider">
                      Selected Tool
                    </span>
                    <h3 className="text-base font-bold text-white mt-0.5">{activeTool.name}</h3>
                    <p className="text-xs text-neutral-400 mt-1">{activeTool.description}</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Your Input / Specification
                    </label>
                    <textarea
                      value={toolInput}
                      onChange={(e) => setToolInput(e.target.value)}
                      placeholder={activeTool.inputPlaceholder}
                      rows={7}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-neutral-600 leading-relaxed resize-none"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-neutral-800">
                  <button
                    onClick={handleRunTool}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-neutral-950 font-semibold text-xs shadow-md transition-all"
                  >
                    <span>Run in CAPP AI</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                  <p className="text-[10px] text-neutral-500 text-center">
                    CAPP AI will structure the output with full context memory.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 text-neutral-500">
                <BookOpen className="w-8 h-8 mb-2 text-neutral-600" />
                <span className="text-xs font-medium">Select a tool to configure and run</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
