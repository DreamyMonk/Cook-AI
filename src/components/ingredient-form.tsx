
// IngredientForm component
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from "@/components/ui/switch";
import { Loader2, ChefHat, Utensils, AlertCircle, Mic, MicOff, Info } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useSpeechRecognition, useSpeechSynthesis } from '@/hooks/use-speech-recognition';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


interface IngredientFormProps {
  onSubmit: (ingredientsString: string, preferredType?: string) => void; // Updated onSubmit signature
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


  useEffect(() => {
    if (isVoiceChatEnabled && isListening) {
        setIngredientsInput((prevInput) => {
            const cleanedPrev = prevInput.trim().replace(/,$/, '').trim();
            const cleanedTranscript = transcript.trim();

            if (!cleanedTranscript) return prevInput;

            if (cleanedTranscript === cleanedPrev || cleanedPrev.endsWith(cleanedTranscript)) {
                 return prevInput;
            }

            if (cleanedPrev && cleanedTranscript) {
                 const lastWordPrev = cleanedPrev.split(/[\s,]+/).pop() || '';
                 const firstWordTranscript = cleanedTranscript.split(/[\s,]+/)[0] || '';

                if (lastWordPrev.toLowerCase() !== firstWordTranscript.toLowerCase()) {
                    return `${cleanedPrev}, ${cleanedTranscript}`;
                } else {
                     const wordsPrev = cleanedPrev.split(/[\s,]+/);
                     wordsPrev.pop();
                     return `${wordsPrev.join(', ')}, ${cleanedTranscript}`;
                }
            } else {
                 return cleanedTranscript;
            }
        });
    }
  }, [transcript, isListening, isVoiceChatEnabled]);


   const handleVoiceChatToggle = (checked: boolean) => {
    setIsVoiceChatEnabled(checked);
    if (!voiceSupport && checked) {
      toast({
        variant: "destructive",
        title: "Voice Chat Not Supported",
        description: "Your browser does not fully support the required Speech Recognition or Synthesis APIs.",
      });
      setIsVoiceChatEnabled(false);
      return;
    }

    if (checked) {
      speak("Voice chat enabled. Please state your ingredients clearly, separated by pauses.");
      setIngredientsInput('');
      resetTranscript();
      startListening();
    } else {
      if (isListening) {
        stopListening();
      }
      speak("Voice chat disabled.");
    }
  };

  const handleGenerateClick = () => {
    setInputError(null);
    const trimmedInput = ingredientsInput.trim();

    if (trimmedInput.length === 0) {
      setInputError('Please list at least one ingredient.');
      return;
    }
    if (trimmedInput.length < 3 && !trimmedInput.includes(',')) {
       setInputError('Ingredient name seems too short. Please enter valid ingredients.');
       return;
    }


    if (trimmedInput.includes(' ') && !trimmedInput.includes(',')) {
       toast({
            variant: "default",
            title: "Check Format",
            description: "Remember to separate multiple ingredients with commas for best results.",
            duration: 5000,
       });
    }

    const nonEmptyIngredients = trimmedInput
                                .split(',')
                                .map(s => s.trim())
                                .filter(Boolean);

    if (nonEmptyIngredients.length === 0) {
        setInputError('No valid ingredients found. Please list ingredients separated by commas.');
        return;
    }

    if (isVoiceChatEnabled && isListening) {
      stopListening();
    }

    // Call onSubmit without preferredType for initial generation
    onSubmit(nonEmptyIngredients.join(', '));
  };

   const toggleManualListen = () => {
       if (!isVoiceChatEnabled || !voiceSupport) return;
       if (isListening) {
           stopListening();
       } else {
           resetTranscript();
           startListening();
       }
   };

  return (
    <div className="space-y-4">
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
              className={`resize-none min-h-[80px] bg-background focus:ring-primary ${inputError ? 'border-destructive focus:ring-destructive' : ''} ${isVoiceChatEnabled ? 'pr-12' : ''}`}
              value={ingredientsInput}
              onChange={(e) => {
                if (!isVoiceChatEnabled) {
                  setIngredientsInput(e.target.value);
                  setInputError(null);
                }
              }}
              aria-label="Enter available ingredients separated by commas"
              aria-invalid={!!inputError}
              aria-describedby="input-error-msg"
              readOnly={isVoiceChatEnabled}
            />
            {isVoiceChatEnabled && voiceSupport && (
              <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={`absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 ${isListening ? 'text-destructive animate-pulse' : 'text-primary'}`}
                  onClick={toggleManualListen}
                  aria-label={isListening ? "Stop listening" : "Start listening"}
                  disabled={isGenerating}
                >
                  {isListening ? <MicOff /> : <Mic />}
                </Button>
             )}
          </div>
           {inputError && (
                <p id="input-error-msg" className="text-sm font-medium text-destructive flex items-center mt-1">
                    <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                    {inputError}
                </p>
            )}
            {isVoiceChatEnabled && speechError && (
                <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Voice Error</AlertTitle>
                    <AlertDescription>{speechError}</AlertDescription>
                </Alert>
             )}

            <div className="flex items-center space-x-2 pt-2">
                <Switch
                    id="voice-chat-switch"
                    checked={isVoiceChatEnabled}
                    onCheckedChange={handleVoiceChatToggle}
                    disabled={isGenerating || !voiceSupport}
                    aria-label="Toggle Interactive Voice Chat"
                />
                <Label htmlFor="voice-chat-switch" className={`text-sm font-medium cursor-pointer ${!voiceSupport ? 'text-muted-foreground italic cursor-not-allowed' : 'text-muted-foreground'}`}>
                    Interactive Voice Chat {!voiceSupport && '(Not Supported)'}
                </Label>
            </div>
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
           <Button
             type="button"
             onClick={handleGenerateClick}
             className="w-full bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary"
             disabled={isGenerating || (isVoiceChatEnabled && isListening)}
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
    </div>
  );
}
