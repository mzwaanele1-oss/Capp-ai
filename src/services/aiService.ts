import { Message, GroundingSource } from '../types';

export interface StreamChatParams {
  messages: Array<{
    role: 'user' | 'assistant';
    text: string;
    attachments?: Array<{
      mimeType: string;
      data: string;
    }>;
  }>;
  memories?: string[];
  webSearch?: boolean;
  temperature?: number;
  stream?: boolean;
  customInstruction?: string;
  signal?: AbortSignal;
  onChunk: (textChunk: string) => void;
  onSources?: (sources: GroundingSource[]) => void;
  onError: (error: string) => void;
  onDone: () => void;
}

export const aiService = {
  async streamChat({
    messages,
    memories = [],
    webSearch = false,
    temperature = 0.7,
    stream = true,
    customInstruction,
    signal,
    onChunk,
    onSources,
    onError,
    onDone,
  }: StreamChatParams): Promise<void> {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          memories,
          webSearch,
          temperature,
          stream,
          customInstruction,
        }),
        signal,
      });

      if (!response.ok) {
        let errMessage = 'Failed to generate response.';
        try {
          const errData = await response.json();
          errMessage = errData.error || errMessage;
        } catch (_) {}
        onError(errMessage);
        onDone();
        return;
      }

      if (!stream) {
        const data = await response.json();
        if (data.text) {
          onChunk(data.text);
        }
        if (data.sources && onSources) {
          onSources(data.sources);
        }
        onDone();
        return;
      }

      // Handle Server-Sent Events stream
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable.');
      }

      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          const dataPayload = trimmed.slice(6);
          if (dataPayload === '[DONE]') {
            onDone();
            return;
          }

          try {
            const parsed = JSON.parse(dataPayload);
            if (parsed.error) {
              onError(parsed.error);
              onDone();
              return;
            }

            if (parsed.text) {
              onChunk(parsed.text);
            }

            if (parsed.sources && onSources) {
              onSources(parsed.sources);
            }
          } catch (e) {
            // Raw text fallback only if not a partial JSON object
            if (dataPayload && !dataPayload.startsWith('{')) {
              onChunk(dataPayload);
            }
          }
        }
      }

      // Check if buffer had a final chunk without a trailing newline
      if (buffer.trim().startsWith('data: ')) {
        const trailing = buffer.trim().slice(6);
        if (trailing && trailing !== '[DONE]') {
          try {
            const parsed = JSON.parse(trailing);
            if (parsed.text) onChunk(parsed.text);
            if (parsed.sources && onSources) onSources(parsed.sources);
          } catch (_) {}
        }
      }

      onDone();
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // User aborted/stopped generation deliberately
        onDone();
        return;
      }
      console.error('Error during chat stream:', err);
      onError(err?.message || 'Something went wrong while connecting to CAPP AI. Please try again.');
      onDone();
    }
  },

  async runImageStudio({
    image,
    task,
    customPrompt,
  }: {
    image: { mimeType: string; data: string };
    task: string;
    customPrompt?: string;
  }): Promise<{ success: boolean; result: string; error?: string }> {
    try {
      const response = await fetch('/api/image-studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image, task, customPrompt }),
      });

      const data = await response.json();
      if (!response.ok) {
        return {
          success: false,
          result: '',
          error: data.error || 'Failed to process image.',
        };
      }

      return {
        success: true,
        result: data.result,
      };
    } catch (err: any) {
      return {
        success: false,
        result: '',
        error: err?.message || 'Network error during image studio processing.',
      };
    }
  },

  // Generates clean conversation title from the first message
  generateTitle(firstMessage: string): string {
    const cleaned = firstMessage
      .replace(/^[\s#*>\-]+/, '')
      .replace(/[^\w\s-]/g, '')
      .trim();
    if (!cleaned) return 'New Conversation';
    const words = cleaned.split(/\s+/);
    if (words.length <= 6) {
      return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }
    return words.slice(0, 5).join(' ') + '...';
  },
};
