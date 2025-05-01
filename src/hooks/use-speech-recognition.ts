
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface SpeechRecognitionHook {
  isListening: boolean;
  transcript: string;
  error: string | null;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

// Type guard for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition | undefined;
    webkitSpeechRecognition: typeof SpeechRecognition | undefined;
  }
}

const getSpeechRecognition = (): typeof SpeechRecognition | null => {
  if (typeof window !== 'undefined') {
    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
  }
  return null;
};

export function useSpeechRecognition(): SpeechRecognitionHook {
  const SpeechRecognition = getSpeechRecognition();
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [finalTranscriptBuffer, setFinalTranscriptBuffer] = useState('');

  useEffect(() => {
    if (!SpeechRecognition) {
      setError('Speech Recognition API is not supported in this browser.');
      setIsSupported(false);
      return;
    }

    setIsSupported(true);
    recognitionRef.current = new SpeechRecognition();
    const recognition = recognitionRef.current;

    recognition.continuous = true; // Keep listening even after pauses
    recognition.interimResults = true; // Get results as they come in
    recognition.lang = 'en-US'; // Set language

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = finalTranscriptBuffer; // Start with the accumulated final transcript

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setFinalTranscriptBuffer(finalTranscript); // Update the buffer
      setTranscript(finalTranscript + interimTranscript); // Show final + interim
      setError(null); // Clear previous errors on new results
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error, event.message);
      let errorMessage = `Speech recognition error: ${event.error}`;
       if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
           errorMessage = 'Microphone access denied. Please allow microphone access in your browser settings.';
       } else if (event.error === 'no-speech') {
           errorMessage = 'No speech detected. Please try speaking again.';
       } else if (event.error === 'network') {
           errorMessage = 'Network error during speech recognition. Please check your connection.';
       } else if (event.error === 'audio-capture') {
           errorMessage = 'Could not capture audio. Is your microphone working?';
       }
      setError(errorMessage);
      setIsListening(false); // Stop listening state on error
    };

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onend = () => {
      setIsListening(false);
      // Don't clear transcript or buffer here, it might be a temporary stop
    };

    // Cleanup function
    return () => {
      recognition.stop();
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onstart = null;
      recognition.onend = null;
      recognitionRef.current = null;
    };
  }, [SpeechRecognition, finalTranscriptBuffer]); // Re-run if buffer changes (though unlikely needed)

  const startListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current || isListening) {
      return;
    }
    try {
        setFinalTranscriptBuffer(''); // Clear buffer on new start
        setTranscript(''); // Clear visible transcript
        setError(null);
        recognitionRef.current.start();
    } catch (err) {
        // Catch potential DOMException if start() is called improperly
        console.error("Error starting recognition:", err);
        setError("Could not start voice recognition. Please try again.");
        setIsListening(false);
    }
  }, [isSupported, recognitionRef, isListening]);

  const stopListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current || !isListening) {
      return;
    }
     try {
        recognitionRef.current.stop();
     } catch (err) {
        console.error("Error stopping recognition:", err);
        // Less critical, but log it
     }
    // isListening state is handled by the onend event
  }, [isSupported, recognitionRef, isListening]);

  const resetTranscript = useCallback(() => {
      setTranscript('');
      setFinalTranscriptBuffer('');
  }, []);

  return {
    isListening,
    transcript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  };
}

// Add SpeechSynthesis related types if needed later
declare global {
    interface Window {
        speechSynthesis: SpeechSynthesis;
    }
}

export function useSpeechSynthesis(): { speak: (text: string) => void; isSupported: boolean } {
    const [isSupported, setIsSupported] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            setIsSupported(true);
        }
    }, []);

    const speak = useCallback((text: string) => {
        if (!isSupported || !window.speechSynthesis) {
            console.warn('Speech Synthesis not supported or available.');
            return;
        }
        try {
            // Cancel any previous utterance
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            window.speechSynthesis.speak(utterance);
        } catch (e) {
            console.error("Error speaking:", e);
        }
    }, [isSupported]);

    return { speak, isSupported };
}
