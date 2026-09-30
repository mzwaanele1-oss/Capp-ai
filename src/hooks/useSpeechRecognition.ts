import { useState, useEffect, useRef, useCallback } from 'react';

// Extend window interface for Web Speech API
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export interface UseSpeechRecognitionOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onTranscriptChange?: (combinedText: string, isFinal: boolean) => void;
  onError?: (errorMessage: string) => void;
}

export interface UseSpeechRecognitionReturn {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  finalTranscript: string;
  isSupported: boolean;
  error: string | null;
  startListening: (baseText?: string) => void;
  stopListening: () => void;
  toggleListening: (baseText?: string) => void;
  resetTranscript: () => void;
  clearError: () => void;
}

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}): UseSpeechRecognitionReturn {
  const {
    lang = typeof navigator !== 'undefined' ? navigator.language || 'en-US' : 'en-US',
    continuous = true,
    interimResults = true,
    onTranscriptChange,
    onError,
  } = options;

  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [finalTranscript, setFinalTranscript] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(false);
  const manualStopRef = useRef<boolean>(false);
  const baseTextRef = useRef<string>('');
  const onTranscriptChangeRef = useRef(onTranscriptChange);
  const onErrorRef = useRef(onError);

  // Keep callback refs updated
  useEffect(() => {
    onTranscriptChangeRef.current = onTranscriptChange;
  }, [onTranscriptChange]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  // Keep isListeningRef in sync with state
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  // Initialize SpeechRecognition instance
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.maxAlternatives = 1;
      recognition.lang = lang;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        let currentFinal = '';

        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          const textChunk = result[0]?.transcript || '';
          if (result.isFinal) {
            currentFinal += (currentFinal ? ' ' : '') + textChunk.trim();
          } else {
            currentInterim += (currentInterim ? ' ' : '') + textChunk.trim();
          }
        }

        setFinalTranscript(currentFinal);
        setInterimTranscript(currentInterim);

        const base = baseTextRef.current.trim();
        const spoken = [currentFinal, currentInterim].filter(Boolean).join(' ').trim();
        const combined = base && spoken ? `${base} ${spoken}` : base || spoken;

        setTranscript(combined);
        onTranscriptChangeRef.current?.(combined, !currentInterim);
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error);
        let errorMsg = 'An error occurred during speech recognition.';

        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          errorMsg = 'Microphone permission was denied. Please allow microphone access in your browser settings.';
          setIsListening(false);
          manualStopRef.current = true;
        } else if (event.error === 'audio-capture') {
          errorMsg = 'No microphone was detected. Please check your audio input device.';
          setIsListening(false);
          manualStopRef.current = true;
        } else if (event.error === 'network') {
          errorMsg = 'Speech recognition network error. Please verify your connection.';
          setIsListening(false);
          manualStopRef.current = true;
        } else if (event.error === 'no-speech') {
          // Non-fatal, keep listening
          return;
        }

        setError(errorMsg);
        onErrorRef.current?.(errorMsg);
      };

      recognition.onend = () => {
        // Continuous restart if not manually stopped
        if (!manualStopRef.current && isListeningRef.current) {
          try {
            recognition.start();
            return;
          } catch {
            // Restart failed, gracefully set state to false
          }
        }

        setIsListening(false);
        setInterimTranscript('');
        manualStopRef.current = false;
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('Could not initialize SpeechRecognition:', err);
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, [lang, continuous, interimResults]);

  const startListening = useCallback((baseText = '') => {
    if (!recognitionRef.current) {
      setError('Web Speech API is not supported in this browser.');
      return;
    }

    manualStopRef.current = false;
    baseTextRef.current = baseText.trim();
    setError(null);
    setInterimTranscript('');
    setFinalTranscript('');

    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch {
      try {
        recognitionRef.current.abort();
        setTimeout(() => {
          recognitionRef.current?.start();
          setIsListening(true);
        }, 100);
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
        setError('Could not access microphone.');
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    manualStopRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  const toggleListening = useCallback((baseText = '') => {
    if (isListeningRef.current) {
      stopListening();
    } else {
      startListening(baseText);
    }
  }, [startListening, stopListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setFinalTranscript('');
    baseTextRef.current = '';
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    finalTranscript,
    isSupported,
    error,
    startListening,
    stopListening,
    toggleListening,
    resetTranscript,
    clearError,
  };
}
