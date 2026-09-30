import { useState, useEffect, useRef, useCallback } from 'react';
import { logToolUsage } from '../utils/usageTracking';

/**
 * Prepares and sanitizes Markdown/AI response text for natural-sounding speech
 */
export function cleanTextForSpeech(text: string): string {
  if (!text) return '';

  return (
    text
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, ', code block omitted for speech, ')
      // Inline code
      .replace(/`([^`]+)`/g, '$1')
      // Images ![alt](url) -> alt
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
      // Links [text](url) -> text
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      // Headers #, ##
      .replace(/^#{1,6}\s+/gm, '')
      // Bold, italics, strikethrough
      .replace(/[*_~]{1,3}/g, '')
      // Blockquotes
      .replace(/^>\s+/gm, '')
      // Horizontal rules
      .replace(/^(-{3,}|\*{3,}|_{3,})$/gm, '')
      // Bullet and numbered lists
      .replace(/^(\s*[-*+]|\s*\d+\.)\s+/gm, '')
      // Clean up multiple line breaks into natural pauses
      .replace(/\n{2,}/g, '. ')
      .replace(/\n/g, ', ')
      // Clean extra spaces
      .replace(/\s{2,}/g, ' ')
      .trim()
  );
}

/**
 * Splits text into sentence chunks to prevent browser SpeechSynthesis
 * 15-second silent timeout cutoff bug on long AI responses.
 */
function splitIntoChunks(text: string, maxChunkLength = 180): string[] {
  if (!text) return [];

  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [text];
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    if ((currentChunk + ' ' + trimmed).length <= maxChunkLength) {
      currentChunk = currentChunk ? `${currentChunk} ${trimmed}` : trimmed;
    } else {
      if (currentChunk) chunks.push(currentChunk);

      if (trimmed.length > maxChunkLength) {
        // Break very long sentence by commas or words
        const words = trimmed.split(' ');
        let subChunk = '';
        for (const word of words) {
          if ((subChunk + ' ' + word).length <= maxChunkLength) {
            subChunk = subChunk ? `${subChunk} ${word}` : word;
          } else {
            if (subChunk) chunks.push(subChunk);
            subChunk = word;
          }
        }
        if (subChunk) currentChunk = subChunk;
        else currentChunk = '';
      } else {
        currentChunk = trimmed;
      }
    }
  }

  if (currentChunk) chunks.push(currentChunk);
  return chunks;
}

/**
 * Hook to retrieve all available SpeechSynthesis voices supported by the browser
 */
export function useSpeechSynthesisVoices(): {
  voices: SpeechSynthesisVoice[];
  isSupported: boolean;
} {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSupported, setIsSupported] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);

    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      if (available && available.length > 0) {
        // Sort voices: English / primary languages first, then alphabetically
        const sorted = [...available].sort((a, b) => {
          const aEng = a.lang.toLowerCase().startsWith('en');
          const bEng = b.lang.toLowerCase().startsWith('en');
          if (aEng && !bEng) return -1;
          if (!aEng && bEng) return 1;
          return a.name.localeCompare(b.name);
        });
        setVoices(sorted);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  return { voices, isSupported };
}

export interface UseTextToSpeechReturn {
  isSpeaking: boolean;
  speakingId: string | null;
  isSupported: boolean;
  voices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  speak: (id: string, text: string) => void;
  stop: () => void;
}

export function useTextToSpeech(selectedVoiceURI?: string): UseTextToSpeechReturn {
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const chunksRef = useRef<string[]>([]);
  const currentChunkIndexRef = useRef<number>(0);
  const activeIdRef = useRef<string | null>(null);
  const isStoppedRef = useRef<boolean>(false);
  const selectedVoiceURIRef = useRef<string | undefined>(selectedVoiceURI);

  useEffect(() => {
    selectedVoiceURIRef.current = selectedVoiceURI;
  }, [selectedVoiceURI]);

  // Initialize and check support
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);

      const updateVoices = () => {
        const available = window.speechSynthesis.getVoices();
        if (available && available.length > 0) {
          const sorted = [...available].sort((a, b) => {
            const aEng = a.lang.toLowerCase().startsWith('en');
            const bEng = b.lang.toLowerCase().startsWith('en');
            if (aEng && !bEng) return -1;
            if (!aEng && bEng) return 1;
            return a.name.localeCompare(b.name);
          });
          setVoices(sorted);
        }
      };

      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    } else {
      setIsSupported(false);
    }

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Compute selected voice object
  const getActiveVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (voices.length === 0) return null;

    const uri = selectedVoiceURIRef.current;
    if (uri) {
      const match = voices.find((v) => v.voiceURI === uri || v.name === uri);
      if (match) return match;
    }

    // Default natural fallback
    const preferred =
      voices.find(
        (v) =>
          v.name.includes('Natural') ||
          v.name.includes('Google') ||
          v.name.includes('Samantha') ||
          v.name.includes('Neural')
      ) ||
      voices.find((v) => v.lang.startsWith('en')) ||
      voices[0];

    return preferred || null;
  }, [voices]);

  const stop = useCallback(() => {
    isStoppedRef.current = true;
    chunksRef.current = [];
    currentChunkIndexRef.current = 0;
    activeIdRef.current = null;
    setSpeakingId(null);

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const playNextChunk = useCallback(() => {
    if (isStoppedRef.current) return;

    if (currentChunkIndexRef.current >= chunksRef.current.length) {
      // Completed all chunks
      stop();
      return;
    }

    const chunk = chunksRef.current[currentChunkIndexRef.current];
    if (!chunk || !chunk.trim()) {
      currentChunkIndexRef.current += 1;
      playNextChunk();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(chunk);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const chosenVoice = getActiveVoice();
    if (chosenVoice) {
      utterance.voice = chosenVoice;
    }

    utterance.onend = () => {
      if (isStoppedRef.current) return;
      currentChunkIndexRef.current += 1;
      playNextChunk();
    };

    utterance.onerror = (e) => {
      // If cancelled by stop(), do not log as error
      if (isStoppedRef.current || e.error === 'canceled' || e.error === 'interrupted') {
        return;
      }
      console.warn('SpeechSynthesis error on chunk:', e);
      currentChunkIndexRef.current += 1;
      playNextChunk();
    };

    window.speechSynthesis.speak(utterance);
  }, [stop, getActiveVoice]);

  const speak = useCallback(
    (id: string, rawText: string) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

      // If already speaking this message, toggle stop
      if (activeIdRef.current === id) {
        stop();
        return;
      }

      // Stop any existing speech
      stop();

      const cleaned = cleanTextForSpeech(rawText);
      if (!cleaned) return;

      logToolUsage('speech_tts', { messageId: id });

      const chunks = splitIntoChunks(cleaned);
      if (chunks.length === 0) return;

      isStoppedRef.current = false;
      chunksRef.current = chunks;
      currentChunkIndexRef.current = 0;
      activeIdRef.current = id;
      setSpeakingId(id);

      playNextChunk();
    },
    [stop, playNextChunk]
  );

  return {
    isSpeaking: Boolean(speakingId),
    speakingId,
    isSupported,
    voices,
    selectedVoice: getActiveVoice(),
    speak,
    stop,
  };
}
