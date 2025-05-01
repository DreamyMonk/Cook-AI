// IngredientForm component
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, ChefHat, Mic, MicOff, Utensils, AlertCircle } from 'lucide-react'; // Added AlertCircle
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
    setInputError(null); // Clear previous errors
    const trimmedInput = ingredientsInput.trim();

    // Validate: Input cannot be empty or too short
    if (trimmedInput.length === 0) {
      setInputError('Please list at least one ingredient.');
      return;
    }
    if (trimmedInput.length < 3 && !trimmedInput.includes(',')) { // Consider very short single ingredients valid
       setInputError('Ingredient name seems too short. Please enter valid ingredients.');
       return;
    }


     // Check for spaces without commas - potential user formatting error
    if (trimmedInput.includes(' ') && !trimmedInput.includes(',')) {
       // Heuristic: If there are spaces suggesting multiple items, but no commas, warn the user.
       toast({
            variant: "default", // Use default variant for non-critical info
            title: "Check Format",
            description: "Remember to separate multiple ingredients with commas for best results.",
            duration: 5000, // Give user time to read
       });
       // Allow submission, but the warning might help them next time.
    }

    // Filter out empty strings resulting from multiple commas (e.g., "a,, b") or leading/trailing commas
    const nonEmptyIngredients = trimmedInput
                                .split(',')
                                .map(s => s.trim()) // Trim whitespace from each potential ingredient
                                .filter(Boolean); // Remove empty strings

    // Validate: After filtering, there should still be at least one valid ingredient
    if (nonEmptyIngredients.length === 0) {
        setInputError('No valid ingredients found. Please list ingredients separated by commas.');
        return;
    }

    // Submit the cleaned-up, comma-separated string
    onSubmit(nonEmptyIngredients.join(', '));
  };

  // Effect to handle recognition events
  useEffect(() => {
    if (!recognition) return;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      // Append with a comma if there's existing text
      setIngredientsInput(prev => (prev.trim() ? `${prev.trim()}, ${transcript}` : transcript));
      setIsListening(false);
      toast({
        title: "Voice input added",
        description: "Ingredients added via microphone.",
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
      // Ensure isListening state reflects that recognition has stopped.
      if (isListening) {
        setIsListening(false);
      }
    };

    // Cleanup function to stop recognition if component unmounts while listening
    return () => {
      if (recognition && isListening) {
        recognition.stop();
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
      // `onend` will set isListening to false
      toast({
        title: "Voice input stopped",
      });
    } else {
      setSpeechError(null); // Clear previous speech errors
      try {
        recognition.start();
        setIsListening(true);
        toast({
          title: "Listening...",
          description: "Speak your ingredients clearly. Say one or multiple, separated by pauses.",
        });
      } catch (error) {
        console.error("Error starting speech recognition:", error);
        let message = 'Could not start voice recognition.';
        if (error instanceof Error) {
            if (error.name === 'NotAllowedError') {
                 message = 'Microphone access denied. Please allow microphone access.';
            } else if (error.name === 'InvalidStateError') {
                message = 'Voice recognition is already active or processing.';
            }
        }
        setSpeechError(message);
        setIsListening(false); // Ensure state is correct if start failed
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
            List ingredients separated by commas (e.g., chicken, rice, broccoli).
          </Label>
          <div className="relative">
            <Textarea
              id="ingredients-input"
              placeholder="Type or use the mic..."
              className={`resize-none min-h-[80px] bg-background focus:ring-primary pr-12 ${inputError ? 'border-destructive focus:ring-destructive' : ''}`} // Add error state styling
              value={ingredientsInput}
              onChange={(e) => { setIngredientsInput(e.target.value); setInputError(null); }} // Clear error on change
              aria-label="Enter available ingredients separated by commas, or use the microphone button"
              aria-invalid={!!inputError} // Indicate invalid state for accessibility
              aria-describedby="input-error-msg" // Link error message
            />
            {SpeechRecognition && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleVoiceInput}
                className={`absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-1 ${isListening ? 'text-destructive animate-pulse' : 'text-muted-foreground hover:text-primary'}`} // Pulse when listening
                aria-label={isListening ? "Stop listening" : "Start voice input"}
                disabled={isGenerating} // Disable mic if main generation is happening
              >
                {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>
            )}
          </div>
           {/* Input Error Display */}
           {inputError && (
                <p id="input-error-msg" className="text-sm font-medium text-destructive flex items-center mt-1">
                    <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                    {inputError}
                </p>
            )}
           {/* Speech Error Display */}
           {speechError && (
                <p className="text-sm font-medium text-destructive flex items-center mt-1">
                     <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                    {speechError}
                </p>
           )}
        </CardContent>
        <CardFooter>
           {/* Generate Recipe Button */}
           <Button
             type="button"
             onClick={handleGenerateClick}
             className="w-full bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary" // Use primary color
             disabled={isGenerating || isListening} // Disable if listening or generating
             aria-live="polite" // Announce changes for screen readers
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
    </div>
  );
}
