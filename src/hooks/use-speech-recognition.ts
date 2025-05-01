
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
  setLanguage: (lang: string) => void; // Added setter
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
  const [currentLanguage, setCurrentLanguage] = useState('en-US'); // State for language

  useEffect(() => {
    if (!SpeechRecognition) {
      setError('Speech Recognition API is not supported in this browser.');
      setIsSupported(false);
      return;
    }

    setIsSupported(true);
    recognitionRef.current = new SpeechRecognition();
    const recognition = recognitionRef.current;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = currentLanguage; // Use state for language

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = finalTranscriptBuffer;

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setFinalTranscriptBuffer(finalTranscript);
      setTranscript(finalTranscript + interimTranscript);
      setError(null);
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
       } else if (event.error === 'language-not-supported') {
            errorMessage = `The selected language (${currentLanguage}) is not supported by speech recognition.`;
       }
      setError(errorMessage);
      setIsListening(false);
    };

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onstart = null;
        recognitionRef.current.onend = null;
        recognitionRef.current = null;
      }
    };
  // Re-initialize recognition if language changes
  }, [SpeechRecognition, finalTranscriptBuffer, currentLanguage]);

  const setLanguage = useCallback((lang: string) => {
      if (lang !== currentLanguage) {
          console.log("Setting speech recognition language to:", lang);
          // Stop current recognition if running
          if (isListening && recognitionRef.current) {
              recognitionRef.current.stop();
          }
          setCurrentLanguage(lang);
          // The useEffect will handle re-initialization
      }
  }, [currentLanguage, isListening]);


  const startListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current || isListening) {
      return;
    }
    try {
        setFinalTranscriptBuffer('');
        setTranscript('');
        setError(null);
        // Ensure language is set before starting
        recognitionRef.current.lang = currentLanguage;
        recognitionRef.current.start();
    } catch (err) {
        console.error("Error starting recognition:", err);
        setError("Could not start voice recognition. Please try again.");
        setIsListening(false);
    }
  }, [isSupported, recognitionRef, isListening, currentLanguage]); // Add currentLanguage dependency

  const stopListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current || !isListening) {
      return;
    }
     try {
        recognitionRef.current.stop();
     } catch (err) {
        console.error("Error stopping recognition:", err);
     }
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
    setLanguage, // Expose setter
  };
}

// --- Speech Synthesis ---
declare global {
    interface Window {
        speechSynthesis: SpeechSynthesis;
    }
}

interface SpeechSynthesisHook {
    speak: (text: string) => void;
    isSupported: boolean;
    setLanguage: (lang: string) => void; // Added setter
}

export function useSpeechSynthesis(): SpeechSynthesisHook {
    const [isSupported, setIsSupported] = useState(false);
    const [currentLanguage, setCurrentLanguage] = useState('en-US'); // State for language

    useEffect(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            setIsSupported(true);
            // Optional: Log available voices on mount
            // window.speechSynthesis.onvoiceschanged = () => {
            //     console.log("Available voices:", window.speechSynthesis.getVoices());
            // };
        }
    }, []);

    const setLanguage = useCallback((lang: string) => {
        if (lang !== currentLanguage) {
            console.log("Setting speech synthesis language to:", lang);
            setCurrentLanguage(lang);
             // Cancel any ongoing speech when language changes
             if (isSupported && window.speechSynthesis) {
                 window.speechSynthesis.cancel();
             }
        }
    }, [currentLanguage, isSupported]);

    const speak = useCallback((text: string) => {
        if (!isSupported || !window.speechSynthesis) {
            console.warn('Speech Synthesis not supported or available.');
            return;
        }
        try {
            window.speechSynthesis.cancel(); // Cancel previous utterance

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = currentLanguage; // Use state language

             // Optional: Find a specific voice for the language if needed
             // const voices = window.speechSynthesis.getVoices();
             // const voice = voices.find(v => v.lang === currentLanguage);
             // if (voice) {
             //     utterance.voice = voice;
             // } else {
             //     console.warn(`No specific voice found for language: ${currentLanguage}. Using default.`);
             // }

            window.speechSynthesis.speak(utterance);
        } catch (e) {
            console.error("Error speaking:", e);
        }
    }, [isSupported, currentLanguage]); // Add currentLanguage dependency

    return { speak, isSupported, setLanguage }; // Expose setter
}
