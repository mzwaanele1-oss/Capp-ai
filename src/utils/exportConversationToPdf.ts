import { jsPDF } from 'jspdf';
import { Conversation } from '../types';

/**
 * Exports an individual conversation to a beautifully formatted PDF file using jsPDF.
 */
export async function exportConversationToPdf(conversation: Conversation): Promise<void> {
  if (!conversation) return;

  const PDFClass = typeof jsPDF === 'function' ? jsPDF : ((jsPDF as any)?.default || (jsPDF as any)?.jsPDF);
  const doc = new PDFClass({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  const bottomMargin = 20;

  let y = margin;

  // Helper to check page break
  const ensureSpace = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - bottomMargin) {
      doc.addPage();
      y = margin;
      drawPageHeader();
    }
  };

  const drawPageHeader = () => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text('CAPP AI — Conversation Export', margin, y);
    doc.text(
      new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }),
      pageWidth - margin,
      y,
      { align: 'right' }
    );
    y += 4;
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;
  };

  // --- Document Cover / Header ---
  // App Title Badge
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(margin, y, 24, 7, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('CAPP AI', margin + 3.5, y + 4.8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Think smarter. Create more.', margin + 28, y + 4.8);
  y += 12;

  // Conversation Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(20, 20, 20);
  const titleLines = doc.splitTextToSize(conversation.title || 'Untitled Conversation', contentWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 7 + 2;

  // Metadata Row
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(115, 115, 115);

  const formattedDate = new Date(conversation.createdAt || Date.now()).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const metaText = `Exported on ${formattedDate} • ${conversation.messages.length} messages`;
  doc.text(metaText, margin, y);
  y += 5;

  // Horizontal divider
  doc.setDrawColor(210, 210, 210);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // --- Messages Stream ---
  for (let i = 0; i < conversation.messages.length; i++) {
    const msg = conversation.messages[i];
    const isUser = msg.role === 'user';

    // Measure space needed for role banner
    ensureSpace(16);

    // Role Indicator pill/box
    const roleLabel = isUser ? 'USER' : 'CAPP AI';
    const roleTime = msg.timestamp
      ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';

    if (isUser) {
      doc.setFillColor(241, 245, 249); // slate-100
      doc.setDrawColor(203, 213, 225); // slate-300
    } else {
      doc.setFillColor(240, 249, 255); // sky-50
      doc.setDrawColor(186, 230, 253); // sky-200
    }

    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, contentWidth, 7, 1.2, 1.2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    if (isUser) {
      doc.setTextColor(51, 65, 85); // slate-700
    } else {
      doc.setTextColor(3, 105, 161); // sky-700
    }
    doc.text(roleLabel, margin + 3, y + 4.8);

    if (roleTime) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(140, 140, 140);
      doc.text(roleTime, pageWidth - margin - 3, y + 4.8, { align: 'right' });
    }

    y += 10;

    // Process Message Text & Code blocks
    const rawText = msg.text || '';
    const textSegments = splitTextAndCode(rawText);

    for (const segment of textSegments) {
      if (segment.type === 'code') {
        // Render code block with light gray background
        const codeLines = doc.splitTextToSize(segment.content, contentWidth - 8);
        const codeHeight = codeLines.length * 4.2 + 6;

        ensureSpace(Math.min(codeHeight, 40));

        // Draw code box
        doc.setFillColor(248, 250, 252); // slate-50
        doc.setDrawColor(226, 232, 240); // slate-200
        doc.roundedRect(margin, y, contentWidth, codeHeight, 1, 1, 'FD');

        doc.setFont('courier', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(30, 41, 59); // slate-800
        doc.text(codeLines, margin + 4, y + 4.5);

        y += codeHeight + 4;
      } else {
        // Render regular prose text
        const cleanedText = cleanMarkdownText(segment.content);
        if (!cleanedText) continue;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(35, 35, 35);

        const lines = doc.splitTextToSize(cleanedText, contentWidth - 4);
        const lineHeight = 4.8;

        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
          ensureSpace(lineHeight + 2);
          doc.text(lines[lineIndex], margin + 2, y);
          y += lineHeight;
        }
        y += 2;
      }
    }

    // Sources and grounding links if any
    if (msg.sources && msg.sources.length > 0) {
      ensureSpace(8 + msg.sources.length * 4);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('Sources & References:', margin + 2, y);
      y += 4;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(2, 132, 199); // sky-600
      msg.sources.forEach((s) => {
        ensureSpace(4);
        const srcText = `• ${s.title}: ${s.url}`;
        const srcLines = doc.splitTextToSize(srcText, contentWidth - 6);
        doc.text(srcLines, margin + 4, y);
        y += srcLines.length * 3.6;
      });
      y += 2;
    }

    y += 6; // Spacing between messages
  }

  // --- Add Page Footers (Page X of Y) ---
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.text(
      `Page ${p} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
    doc.text(
      'Exported from CAPP AI',
      pageWidth - margin,
      pageHeight - 8,
      { align: 'right' }
    );
  }

  // Save the PDF file
  const sanitizedTitle = (conversation.title || 'capp-ai-conversation')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  doc.save(`${sanitizedTitle || 'capp-ai-conversation'}.pdf`);
}

/**
 * Splits text into prose and code block segments
 */
function splitTextAndCode(text: string): Array<{ type: 'text' | 'code'; content: string }> {
  const segments: Array<{ type: 'text' | 'code'; content: string }> = [];
  const codeBlockRegex = /```(?:[a-zA-Z0-9_-]+)?\n([\s\S]*?)```/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: text.substring(lastIndex, match.index),
      });
    }
    segments.push({
      type: 'code',
      content: match[1].trimEnd(),
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.substring(lastIndex),
    });
  }

  return segments.length > 0 ? segments : [{ type: 'text', content: text }];
}

/**
 * Cleans markdown headers, bold, italics, backticks for clean PDF readability
 */
function cleanMarkdownText(text: string): string {
  if (!text) return '';
  return text
    // Replace markdown headers with uppercase or clean text
    .replace(/^#{1,6}\s+(.+)$/gm, '$1')
    // Remove bold/italic markers
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Inline code
    .replace(/`([^`]+)`/g, '$1')
    // Links [title](url) -> title (url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
    .trim();
}
