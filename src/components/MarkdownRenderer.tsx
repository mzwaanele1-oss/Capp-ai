import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Helper to parse inline markdown (bold, italics, inline code, links)
  const renderInline = (text: string) => {
    // Regex for inline code, links, bold, italics
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let keyIdx = 0;

    // Pattern matches `inline code`, [link](url), **bold**, *italic*
    const regex = /(`[^`]+`|\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
    let match: RegExpExecArray | null;
    let lastIndex = 0;

    while ((match = regex.exec(text)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      const fullMatch = match[0];

      if (fullMatch.startsWith('`') && fullMatch.endsWith('`')) {
        // Inline code
        parts.push(
          <code
            key={keyIdx++}
            className="px-1.5 py-0.5 mx-0.5 rounded text-xs font-mono bg-neutral-800 text-neutral-200 border border-neutral-700/60"
          >
            {fullMatch.slice(1, -1)}
          </code>
        );
      } else if (fullMatch.startsWith('[') && match[2] && match[3]) {
        // Link
        parts.push(
          <a
            key={keyIdx++}
            href={match[3]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-100 underline decoration-neutral-500 hover:decoration-white font-medium transition-colors"
          >
            {match[2]}
          </a>
        );
      } else if (fullMatch.startsWith('**') && fullMatch.endsWith('**')) {
        // Bold
        parts.push(
          <strong key={keyIdx++} className="font-semibold text-neutral-100">
            {match[4]}
          </strong>
        );
      } else if (fullMatch.startsWith('*') && fullMatch.endsWith('*')) {
        // Italic
        parts.push(
          <em key={keyIdx++} className="italic text-neutral-200">
            {match[5]}
          </em>
        );
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  // Main block parser
  const renderBlocks = () => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;
    let blockIndex = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Code blocks (```language ... ```)
      if (line.trim().startsWith('```')) {
        const langMatch = line.trim().match(/^```([a-zA-Z0-9_\-#+]*)/);
        const language = (langMatch && langMatch[1]) ? langMatch[1] : 'code';
        const codeLines: string[] = [];
        i++;

        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        // skip closing ```
        i++;

        const codeString = codeLines.join('\n');
        const codeId = blockIndex++;

        elements.push(
          <div
            key={`code-${codeId}`}
            className="my-3 rounded-xl border border-neutral-800 bg-neutral-950 overflow-hidden shadow-sm"
          >
            <div className="flex items-center justify-between px-3.5 py-1.5 bg-neutral-900/90 border-b border-neutral-800 text-xs text-neutral-400 font-mono">
              <span className="uppercase text-[11px] font-medium tracking-wider text-neutral-400">
                {language || 'code'}
              </span>
              <button
                onClick={() => handleCopyCode(codeString, codeId)}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
                title="Copy code"
              >
                {copiedIndex === codeId ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 text-xs">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 text-xs sm:text-sm font-mono text-neutral-200 overflow-x-auto leading-relaxed bg-black/40">
              <code>{codeString}</code>
            </pre>
          </div>
        );
        continue;
      }

      // Markdown Tables (| Header | Header |)
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        const tableLines: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
          tableLines.push(lines[i].trim());
          i++;
        }

        if (tableLines.length >= 2) {
          const headerRow = tableLines[0].split('|').slice(1, -1).map(c => c.trim());
          // check if second row is separator like |---|---|
          const hasSeparator = tableLines[1].replace(/[\s\-|:]/g, '').length === 0;
          const bodyRows = tableLines.slice(hasSeparator ? 2 : 1).map(r => r.split('|').slice(1, -1).map(c => c.trim()));

          elements.push(
            <div key={`table-${blockIndex++}`} className="my-3 overflow-x-auto rounded-lg border border-neutral-800">
              <table className="min-w-full text-left text-xs sm:text-sm divide-y divide-neutral-800">
                <thead className="bg-neutral-900/80 text-neutral-200">
                  <tr>
                    {headerRow.map((h, hIdx) => (
                      <th key={hIdx} className="px-3.5 py-2 font-semibold tracking-wide">
                        {renderInline(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60 bg-neutral-950/40">
                  {bodyRows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-neutral-900/40 transition-colors">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-3.5 py-2 text-neutral-300">
                          {renderInline(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
          continue;
        }
      }

      // Headings
      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={`h1-${blockIndex++}`} className="text-xl sm:text-2xl font-bold text-white mt-4 mb-2 tracking-tight">
            {renderInline(line.substring(2))}
          </h1>
        );
        i++;
        continue;
      }
      if (line.startsWith('## ')) {
        elements.push(
          <h2 key={`h2-${blockIndex++}`} className="text-lg sm:text-xl font-bold text-white mt-3.5 mb-1.5 tracking-tight">
            {renderInline(line.substring(3))}
          </h2>
        );
        i++;
        continue;
      }
      if (line.startsWith('### ')) {
        elements.push(
          <h3 key={`h3-${blockIndex++}`} className="text-base sm:text-lg font-semibold text-neutral-100 mt-3 mb-1">
            {renderInline(line.substring(4))}
          </h3>
        );
        i++;
        continue;
      }

      // Blockquotes
      if (line.startsWith('> ')) {
        elements.push(
          <blockquote
            key={`quote-${blockIndex++}`}
            className="border-l-2 border-neutral-600 pl-3.5 my-2 text-neutral-300 italic bg-neutral-900/30 py-1 rounded-r"
          >
            {renderInline(line.substring(2))}
          </blockquote>
        );
        i++;
        continue;
      }

      // Unordered lists (- or *)
      if (/^[\*\-]\s+/.test(line.trim())) {
        const listItems: string[] = [];
        while (i < lines.length && /^[\*\-]\s+/.test(lines[i].trim())) {
          listItems.push(lines[i].trim().replace(/^[\*\-]\s+/, ''));
          i++;
        }
        elements.push(
          <ul key={`ul-${blockIndex++}`} className="my-2 space-y-1 pl-5 list-disc text-neutral-300">
            {listItems.map((item, idx) => (
              <li key={idx} className="leading-relaxed text-sm sm:text-base">
                {renderInline(item)}
              </li>
            ))}
          </ul>
        );
        continue;
      }

      // Numbered lists (1. 2.)
      if (/^\d+\.\s+/.test(line.trim())) {
        const listItems: string[] = [];
        while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
          listItems.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
          i++;
        }
        elements.push(
          <ol key={`ol-${blockIndex++}`} className="my-2 space-y-1 pl-5 list-decimal text-neutral-300">
            {listItems.map((item, idx) => (
              <li key={idx} className="leading-relaxed text-sm sm:text-base">
                {renderInline(item)}
              </li>
            ))}
          </ol>
        );
        continue;
      }

      // Horizontal rule
      if (/^(\-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
        elements.push(<hr key={`hr-${blockIndex++}`} className="my-4 border-neutral-800" />);
        i++;
        continue;
      }

      // Empty line
      if (!line.trim()) {
        i++;
        continue;
      }

      // Standard paragraph
      elements.push(
        <p key={`p-${blockIndex++}`} className="my-1.5 leading-relaxed text-neutral-200 text-sm sm:text-base">
          {renderInline(line)}
        </p>
      );
      i++;
    }

    return elements;
  };

  return <div className="space-y-1 break-words">{renderBlocks()}</div>;
};
