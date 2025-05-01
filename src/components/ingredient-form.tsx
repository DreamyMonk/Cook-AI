
// IngredientForm component
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from "@/components/ui/switch";
import { Loader2, ChefHat, Utensils, AlertCircle, Mic, MicOff, Info } from 'lucide-react'; // Added Mic icons
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useSpeechRecognition, useSpeechSynthesis } from '@/hooks/use-speech-recognition'; // Import hooks
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Import Alert


interface IngredientFormProps {
  onSubmit: (ingredientsString: string) => void;
  isGenerating: boolean;
}

export function IngredientForm({ onSubmit, isGenerating }: IngredientFormProps) {
  const { toast } = useToast();
  const [ingredientsInput, setIngredientsInput] = useState<string>('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [isVoiceChatEnabled, setIsVoiceChatEnabled] = useState(false);

  // --- Speech Recognition Hook ---
  const {
    isListening,
    transcript,
    error: speechError,
    isSupported: speechRecognitionSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  // --- Speech Synthesis Hook ---
   const { speak, isSupported: speechSynthesisSupported } = useSpeechSynthesis();
   const voiceSupport = useMemo(() => speechRecognitionSupported && speechSynthesisSupported, [speechRecognitionSupported, speechSynthesisSupported]);


  // Effect to update textarea with transcript when listening
  useEffect(() => {
    if (isVoiceChatEnabled && isListening) {
        // Append recognized transcript, handling potential commas
        // Basic logic: if the new transcript ends with a word, add a comma and space
        // This is a simple heuristic and might need refinement
        setIngredientsInput((prevInput) => {
            const cleanedPrev = prevInput.trim().replace(/,$/, '').trim(); // Remove trailing comma if exists
            const cleanedTranscript = transcript.trim();

            if (!cleanedTranscript) return prevInput; // No new transcript

             // Avoid adding duplicate content if transcript hasn't changed significantly
             // Note: This comparison is basic. More robust logic might be needed.
            if (cleanedTranscript === cleanedPrev || cleanedPrev.endsWith(cleanedTranscript)) {
                 return prevInput;
            }

            if (cleanedPrev && cleanedTranscript) {
                // Check if the transcript seems to be a continuation or a new item
                // Simple check: does the new transcript start differently than the end of the old one?
                 const lastWordPrev = cleanedPrev.split(/[\s,]+/).pop() || '';
                 const firstWordTranscript = cleanedTranscript.split(/[\s,]+/)[0] || '';

                if (lastWordPrev.toLowerCase() !== firstWordTranscript.toLowerCase()) {
                    return `${cleanedPrev}, ${cleanedTranscript}`;
                } else {
                     // Assume it's refining the last word or phrase
                     // Replace the end of the previous input with the new transcript
                     const wordsPrev = cleanedPrev.split(/[\s,]+/);
                     wordsPrev.pop(); // Remove the potentially incomplete last word
                     return `${wordsPrev.join(', ')}, ${cleanedTranscript}`;
                }
            } else {
                 return cleanedTranscript; // First ingredient
            }
        });
    }
  }, [transcript, isListening, isVoiceChatEnabled]);


   // Handle switching voice chat on/off
   const handleVoiceChatToggle = (checked: boolean) => {
    setIsVoiceChatEnabled(checked);
    if (!voiceSupport && checked) {
      toast({
        variant: "destructive",
        title: "Voice Chat Not Supported",
        description: "Your browser does not fully support the required Speech Recognition or Synthesis APIs.",
      });
      setIsVoiceChatEnabled(false); // Force disable if not supported
      return;
    }

    if (checked) {
      speak("Voice chat enabled. Please state your ingredients clearly, separated by pauses.");
      setIngredientsInput(''); // Clear input when enabling voice
      resetTranscript();
      startListening(); // Start listening immediately
    } else {
      if (isListening) {
        stopListening();
      }
      speak("Voice chat disabled.");
      // Keep the transcribed input when disabling
    }
  };

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

    // If voice chat was active, stop listening before submitting
    if (isVoiceChatEnabled && isListening) {
      stopListening();
    }

    // Submit the cleaned-up, comma-separated string
    onSubmit(nonEmptyIngredients.join(', '));
  };

  // Function to manually start/stop listening within voice chat mode
   const toggleManualListen = () => {
       if (!isVoiceChatEnabled || !voiceSupport) return;
       if (isListening) {
           stopListening();
           // Optional: speak("Stopped listening.")
       } else {
           resetTranscript(); // Reset before starting manually
           startListening();
           // Optional: speak("Listening...")
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
              placeholder={isVoiceChatEnabled ? (isListening ? "Listening..." : "Voice chat active. Tap mic to speak.") : "Type your ingredients..."}
              className={`resize-none min-h-[80px] bg-background focus:ring-primary ${inputError ? 'border-destructive focus:ring-destructive' : ''} ${isVoiceChatEnabled ? 'pr-12' : ''}`} // Add padding for mic button if voice enabled
              value={ingredientsInput}
              onChange={(e) => {
                if (!isVoiceChatEnabled) { // Only allow manual typing if voice chat is off
                  setIngredientsInput(e.target.value);
                  setInputError(null);
                }
              }}
              aria-label="Enter available ingredients separated by commas"
              aria-invalid={!!inputError} // Indicate invalid state for accessibility
              aria-describedby="input-error-msg"
              readOnly={isVoiceChatEnabled} // Make textarea read-only in voice chat mode
            />
            {/* Mic button - Only shown when voice chat is enabled and supported */}
            {isVoiceChatEnabled && voiceSupport && (
              <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={`absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 ${isListening ? 'text-destructive animate-pulse' : 'text-primary'}`}
                  onClick={toggleManualListen}
                  aria-label={isListening ? "Stop listening" : "Start listening"}
                  disabled={isGenerating} // Disable mic interaction while main process is running
                >
                  {isListening ? <MicOff /> : <Mic />}
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
           {/* Speech Recognition Error Display */}
            {isVoiceChatEnabled && speechError && (
                <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Voice Error</AlertTitle>
                    <AlertDescription>{speechError}</AlertDescription>
                </Alert>
             )}

           {/* Voice Chat Switch */}
            <div className="flex items-center space-x-2 pt-2">
                <Switch
                    id="voice-chat-switch"
                    checked={isVoiceChatEnabled}
                    onCheckedChange={handleVoiceChatToggle} // Use the new handler
                    disabled={isGenerating || !voiceSupport} // Disable if generating or not supported
                    aria-label="Toggle Interactive Voice Chat"
                />
                <Label htmlFor="voice-chat-switch" className={`text-sm font-medium cursor-pointer ${!voiceSupport ? 'text-muted-foreground italic cursor-not-allowed' : 'text-muted-foreground'}`}>
                    Interactive Voice Chat {!voiceSupport && '(Not Supported)'}
                </Label>
            </div>
             {/* Status Indicator for Voice Chat */}
             {isVoiceChatEnabled && voiceSupport && (
                 <div className="text-xs text-muted-foreground italic p-2 border border-dashed border-primary/50 rounded-md bg-primary/10 flex items-center">
                    <Info className="h-3 w-3 mr-1.5 flex-shrink-0 text-primary"/>
                    {isListening ? "Actively listening for ingredients..." : "Voice chat is on. Tap the mic icon to speak."}
                 </div>
             )}
             {isVoiceChatEnabled && !voiceSupport && (
                  <div className="text-xs text-destructive italic p-2 border border-dashed border-destructive/50 rounded-md bg-destructive/10 flex items-center">
                     <AlertCircle className="h-3 w-3 mr-1.5 flex-shrink-0"/>
                     Voice chat requires browser support for Speech Recognition and Synthesis.
                  </div>
             )}
        </CardContent>
        <CardFooter>
           {/* Generate Recipe Button */}
           <Button
             type="button"
             onClick={handleGenerateClick}
             className="w-full bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary" // Use primary color
             disabled={isGenerating || (isVoiceChatEnabled && isListening)} // Disable if generating OR if actively listening in voice mode
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
