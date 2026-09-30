import React from 'react';
import {
  Sparkles,
  Code2,
  HelpCircle,
  ListOrdered,
  Lightbulb,
  ArrowRight,
  FileText,
  CornerDownLeft,
} from 'lucide-react';
import { FollowUpPrompt } from '../types';

interface FollowUpPromptButtonsProps {
  prompts: FollowUpPrompt[];
  onSelectPrompt: (promptText: string) => void;
  disabled?: boolean;
}

export const FollowUpPromptButtons: React.FC<FollowUpPromptButtonsProps> = ({
  prompts,
  onSelectPrompt,
  disabled = false,
}) => {
  if (!prompts || prompts.length === 0) {
    return null;
  }

  const getIcon = (iconType?: FollowUpPrompt['icon']) => {
    switch (iconType) {
      case 'code':
        return <Code2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
      case 'help':
        return <HelpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      case 'list':
        return <ListOrdered className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case 'lightbulb':
        return <Lightbulb className="w-3.5 h-3.5 text-yellow-400 shrink-0" />;
      case 'arrow':
        return <ArrowRight className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
      case 'file':
        return <FileText className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
      case 'sparkles':
      default:
        return <Sparkles className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
    }
  };

  return (
    <div className="w-full mt-3 pt-2 pb-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-1.5 mb-2 text-xs font-medium text-neutral-400">
        <Sparkles className="w-3.5 h-3.5 text-sky-400" />
        <span className="tracking-wide">Suggested follow-ups:</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {prompts.map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelectPrompt(item.prompt)}
            title={item.prompt}
            className="group relative flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-900/90 hover:bg-neutral-800/90 border border-neutral-800 hover:border-neutral-700 text-left text-xs font-medium text-neutral-300 hover:text-white transition-all shadow-xs hover:shadow-md active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none max-w-full"
          >
            {getIcon(item.icon)}

            <span className="truncate max-w-[280px] sm:max-w-md">
              {item.label}
            </span>

            <CornerDownLeft className="w-3 h-3 text-neutral-500 group-hover:text-neutral-300 shrink-0 ml-0.5 transition-colors opacity-0 group-hover:opacity-100 hidden sm:inline" />
          </button>
        ))}
      </div>
    </div>
  );
};
