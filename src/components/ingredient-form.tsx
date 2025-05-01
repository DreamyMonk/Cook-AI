// IngredientForm component
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, ChefHat, Mic, MicOff, Utensils } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'; // Added Card components


interface IngredientFormProps {
  onSubmit: (ingredientsString: string) => void; // Changed onSubmit prop type to accept raw string
  isGenerating: boolean;
}

// Check for SpeechRecognition API availability
const SpeechRecognition =
  typeof window !== 'undefined'
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;
let recognition: SpeechRecognition | null = null;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
}

export function IngredientForm({ onSubmit, isGenerating }: IngredientFormProps) {
  const { toast } = useToast();
  const [ingredientsInput, setIngredientsInput] = useState<string>('');
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);


  const handleGenerateClick = () => {
    setInputError(null);
    const trimmedInput = ingredientsInput.trim();
    if (trimmedInput.length < 3) {
      setInputError('Please list at least one ingredient.');
      return;
    }
     // Basic check for comma separation if multiple items seem present
    if (trimmedInput.includes(' ') && !trimmedInput.includes(',')) {
       // Simple heuristic: if there are spaces but no commas, warn the user.
       // This isn't foolproof but covers common cases.
       toast({
            variant: "default",
            title: "Check Input Format",
            description: "Did you forget to separate ingredients with commas?",
       });
       // Allow submission anyway, but warn.
    }

    // Filter out potentially empty strings resulting from bad comma usage (e.g., "a,,b")
    const nonEmptyIngredients = trimmedInput.split(',').map(s => s.trim()).filter(Boolean);
    if (nonEmptyIngredients.length === 0) {
        setInputError('No valid ingredients entered. Please list ingredients separated by commas.');
        return;
    }

    onSubmit(nonEmptyIngredients.join(', ')); // Submit the cleaned-up string
  };

  // Effect to handle recognition events
  useEffect(() => {
    if (!recognition) return;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setIngredientsInput(prev => (prev ? `${prev}, ${transcript}` : transcript));
      setIsListening(false);
      toast({
        title: "Transcription complete",
        description: "Your voice input has been added.",
      });
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      let errorMessage = 'Speech recognition error occurred.';
      if (event.error === 'no-speech') {
        errorMessage = 'No speech detected. Please try again.';
      } else if (event.error === 'audio-capture') {
        errorMessage = 'Audio capture failed. Check microphone permissions.';
      } else if (event.error === 'not-allowed') {
        errorMessage = 'Microphone access denied. Please allow microphone access in your browser settings.';
      }
      setSpeechError(errorMessage);
      setIsListening(false);
      toast({
        variant: "destructive",
        title: "Voice Input Error",
        description: errorMessage,
      });
    };

    recognition.onend = () => {
      // Check if still in listening state before setting to false,
      // avoids potential state update conflicts if stopped manually.
      if (isListening) {
        setIsListening(false);
      }
    };

    // Cleanup function to stop recognition if component unmounts while listening
    return () => {
      if (recognition && isListening) {
        recognition.stop();
        // Ensure isListening state reflects that recognition has stopped.
        // Directly setting state here might be problematic if unmounting.
        // The onend handler should ideally cover this.
      }
    };
  }, [isListening, toast]); // isListening is a dependency

  const handleVoiceInput = () => {
    if (!recognition) {
      toast({
        variant: "destructive",
        title: "Browser Not Supported",
        description: "Your browser does not support voice recognition.",
      });
      return;
    }

    if (isListening) {
      recognition.stop();
      // No need to manually set isListening to false here, `onend` handles it.
      toast({
        title: "Voice input stopped",
      });
    } else {
      setSpeechError(null);
      try {
        // Ensure recognition isn't already running before starting
        recognition.start();
        setIsListening(true);
        toast({
          title: "Listening...",
          description: "Speak your ingredients clearly.",
        });
      } catch (error) {
        // Catch specific errors if possible (e.g., InvalidStateError if already started)
        console.error("Error starting speech recognition:", error);
        let message = 'Could not start voice recognition.';
        if (error instanceof Error) {
            if (error.name === 'NotAllowedError') {
                 message = 'Microphone access denied. Please allow microphone access.';
            } else if (error.name === 'InvalidStateError') {
                // Handle case where recognition might already be active
                message = 'Voice recognition is already active or processing.';
                setIsListening(false); // Correct state if it failed to start
            }
        }

        setSpeechError(message);
        // Ensure isListening is false if start failed
        if(isListening) setIsListening(false);
        toast({
          variant: "destructive",
          title: "Voice Recognition Error",
          description: message,
        });
      }
    }
  };

  return (
    <div className="space-y-4"> {/* Reduced spacing */}
      {/* Input Area */}
      <Card className="bg-secondary/30 border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium text-foreground flex items-center">
            <Utensils className="h-5 w-5 mr-2 text-primary" />
            Enter Ingredients
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <Label htmlFor="ingredients-input" className="text-sm text-muted-foreground">
            List ingredients separated by commas, or use the microphone.
          </Label>
          <div className="relative">
            <Textarea
              id="ingredients-input"
              placeholder="e.g., chicken breast, rice, broccoli, soy sauce..." // Updated placeholder
              className="resize-none min-h-[80px] bg-background focus:ring-primary pr-12" // Use primary ring
              value={ingredientsInput}
              onChange={(e) => { setIngredientsInput(e.target.value); setInputError(null); }} // Clear error on change
              aria-label="Enter available ingredients separated by commas, or use the microphone button"
              aria-invalid={!!inputError}
              aria-describedby="input-error-msg"
            />
            {SpeechRecognition && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleVoiceInput}
                className={`absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-1 ${isListening ? 'text-destructive' : 'text-muted-foreground hover:text-primary'}`}
                aria-label={isListening ? "Stop listening" : "Start voice input"}
                disabled={isGenerating} // Disable mic if main generation is happening
              >
                {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>
            )}
          </div>
           {inputError && <p id="input-error-msg" className="text-sm font-medium text-destructive mt-1">{inputError}</p>}
           {speechError && <p className="text-sm font-medium text-destructive mt-1">{speechError}</p>}
        </CardContent>
        <CardFooter>
           {/* This button now directly triggers generation */}
           <Button
             type="button"
             onClick={handleGenerateClick}
             className="w-full bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary" // Use primary color
             disabled={isGenerating || isListening || !ingredientsInput.trim()} // Disable if listening or generating
             aria-live="polite"
           >
             {isGenerating ? (
               <>
                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                 Generating...
               </>
             ) : (
               <>
                 <ChefHat className="mr-2 h-4 w-4" />
                 Generate Recipe
               </>
             )}
           </Button>
        </CardFooter>
      </Card>

      {/* Removed the Parsed Ingredients Checklist section */}
    </div>
  );
}
