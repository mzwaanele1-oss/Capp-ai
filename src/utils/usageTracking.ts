import { Conversation, Message } from '../types';

export type ToolType =
  | 'web_search'
  | 'image_studio'
  | 'speech_tts'
  | 'pdf_export'
  | 'markdown_export'
  | 'creative_tool';

export interface ToolUsageEvent {
  id: string;
  tool: ToolType;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface DailyUsageStats {
  dateStr: string;
  label: string;
  dayOfWeek: string;
  userMessages: number;
  assistantMessages: number;
  totalMessages: number;
  estimatedWords: number;
  toolUsage: {
    web_search: number;
    image_studio: number;
    speech_tts: number;
    pdf_export: number;
    markdown_export: number;
    creative_tool: number;
    total: number;
  };
}

const TOOL_EVENTS_KEY = 'capp_ai_tool_usage_events_v1';

/**
 * Record a tool usage event into persistent storage
 */
export function logToolUsage(tool: ToolType, metadata?: Record<string, any>): void {
  try {
    const raw = localStorage.getItem(TOOL_EVENTS_KEY);
    const events: ToolUsageEvent[] = raw ? JSON.parse(raw) : [];
    events.push({
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      tool,
      timestamp: Date.now(),
      metadata,
    });
    // Keep last 1,000 events to prevent storage bloat
    if (events.length > 1000) {
      events.splice(0, events.length - 1000);
    }
    localStorage.setItem(TOOL_EVENTS_KEY, JSON.stringify(events));
  } catch (err) {
    console.warn('Failed to log tool usage event:', err);
  }
}

/**
 * Retrieve all logged tool usage events
 */
export function getToolUsageEvents(): ToolUsageEvent[] {
  try {
    const raw = localStorage.getItem(TOOL_EVENTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to load tool usage events:', err);
    return [];
  }
}

/**
 * Aggregate daily statistics across conversations and tool usage events
 */
export function getDailyUsageStats(
  conversations: Conversation[],
  daysCount: number = 7
): DailyUsageStats[] {
  const events = getToolUsageEvents();
  const now = new Date();

  // Generate date buckets for the last N days (oldest to newest)
  const statsMap: Map<string, DailyUsageStats> = new Map();

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const dayOfWeek = d.toLocaleDateString(undefined, { weekday: 'short' });

    statsMap.set(dateStr, {
      dateStr,
      label,
      dayOfWeek,
      userMessages: 0,
      assistantMessages: 0,
      totalMessages: 0,
      estimatedWords: 0,
      toolUsage: {
        web_search: 0,
        image_studio: 0,
        speech_tts: 0,
        pdf_export: 0,
        markdown_export: 0,
        creative_tool: 0,
        total: 0,
      },
    });
  }

  // 1. Process Messages from all conversations
  conversations.forEach((convo) => {
    convo.messages.forEach((msg) => {
      const msgDate = new Date(msg.timestamp);
      const year = msgDate.getFullYear();
      const month = String(msgDate.getMonth() + 1).padStart(2, '0');
      const day = String(msgDate.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;

      const entry = statsMap.get(dateKey);
      if (entry) {
        if (msg.role === 'user') {
          entry.userMessages += 1;
        } else {
          entry.assistantMessages += 1;
        }
        entry.totalMessages += 1;

        if (msg.text) {
          const words = msg.text.trim().split(/\s+/).filter(Boolean).length;
          entry.estimatedWords += words;
        }

        // Implicit tool usage in historical messages:
        if (msg.sources && msg.sources.length > 0) {
          entry.toolUsage.web_search += 1;
          entry.toolUsage.total += 1;
        }
        if (msg.attachments && msg.attachments.length > 0) {
          entry.toolUsage.image_studio += 1;
          entry.toolUsage.total += 1;
        }
      }
    });
  });

  // 2. Process Explicit Tool Usage Events
  events.forEach((evt) => {
    const evtDate = new Date(evt.timestamp);
    const year = evtDate.getFullYear();
    const month = String(evtDate.getMonth() + 1).padStart(2, '0');
    const day = String(evtDate.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;

    const entry = statsMap.get(dateKey);
    if (entry && evt.tool in entry.toolUsage) {
      entry.toolUsage[evt.tool] += 1;
      entry.toolUsage.total += 1;
    }
  });

  return Array.from(statsMap.values());
}
