// IngredientForm component
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, ChefHat, Mic, MicOff, ListChecks, Utensils } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'; // Added Card components

interface IngredientItem {
  id: string;
  name: string;
  available: boolean;
}

interface IngredientFormProps {
  onSubmit: (data: IngredientItem[]) => void; // Changed onSubmit prop type
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
  const [parsedIngredients, setParsedIngredients] = useState<IngredientItem[] | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);

  const handleParseIngredients = () => {
    setInputError(null);
    if (ingredientsInput.trim().length < 3) {
      setInputError('Please list at least one ingredient.');
      setParsedIngredients(null); // Clear previous list if input is invalid
      return;
    }
    const ingredientsArray = ingredientsInput
      .split(',')
      .map((name, index) => ({
        id: `ing-${index}-${Date.now()}`, // Simple unique ID
        name: name.trim(),
        available: true, // Default to available
      }))
      .filter(item => item.name); // Filter out empty strings

    if (ingredientsArray.length === 0) {
       setInputError('No valid ingredients found. Please separate them with commas.');
       setParsedIngredients(null);
       return;
    }

    setParsedIngredients(ingredientsArray);
  };

  const handleAvailabilityChange = (id: string, checked: boolean) => {
    setParsedIngredients(prev =>
      prev
        ? prev.map(ing =>
            ing.id === id ? { ...ing, available: checked } : ing
          )
        : null
    );
  };

  const handleGenerateClick = () => {
    if (parsedIngredients) {
      onSubmit(parsedIngredients);
    } else {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Please parse your ingredients first.",
        });
    }
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
      if (isListening) {
        setIsListening(false);
      }
    };

    return () => {
      if (recognition && isListening) {
        recognition.stop();
        setIsListening(false);
      }
    };
  }, [isListening, toast]);

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
      setIsListening(false);
      toast({
        title: "Voice input stopped",
      });
    } else {
      setSpeechError(null);
      try {
        recognition.start();
        setIsListening(true);
        toast({
          title: "Listening...",
          description: "Speak your ingredients clearly.",
        });
      } catch (error) {
        console.error("Error starting speech recognition:", error);
        let message = 'Could not start voice recognition.';
        if (error instanceof Error && error.name === 'NotAllowedError') {
          message = 'Microphone access denied. Please allow microphone access.';
        }
        setSpeechError(message);
        setIsListening(false);
        toast({
          variant: "destructive",
          title: "Voice Recognition Error",
          description: message,
        });
      }
    }
  };

  return (
    <div className="space-y-6">
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
              placeholder="e.g., chicken breast, broccoli, soy sauce, garlic, rice..."
              className="resize-none min-h-[80px] bg-background focus:ring-accent pr-12"
              value={ingredientsInput}
              onChange={(e) => setIngredientsInput(e.target.value)}
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
                disabled={isGenerating}
              >
                {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>
            )}
          </div>
           {inputError && <p id="input-error-msg" className="text-sm font-medium text-destructive mt-1">{inputError}</p>}
           {speechError && <p className="text-sm font-medium text-destructive mt-1">{speechError}</p>}
        </CardContent>
        <CardFooter>
          <Button
            type="button"
            onClick={handleParseIngredients}
            className="w-full"
            disabled={isGenerating || isListening || !ingredientsInput.trim()}
          >
            <ListChecks className="mr-2 h-4 w-4" />
            Confirm & Review Ingredients
          </Button>
        </CardFooter>
      </Card>


      {/* Parsed Ingredients Checklist */}
      {parsedIngredients && (
        <Card className="border-border/50">
          <CardHeader className="pb-2">
             <CardTitle className="text-lg font-medium text-foreground flex items-center">
                <ListChecks className="h-5 w-5 mr-2 text-primary"/>
                Review Availability
             </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-60 overflow-y-auto pr-2">
             <p className="text-sm text-muted-foreground">Confirm which ingredients are currently available (checked = available).</p>
            {parsedIngredients.map((ingredient) => (
              <div key={ingredient.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-secondary/50">
                <Checkbox
                  id={ingredient.id}
                  checked={ingredient.available}
                  onCheckedChange={(checked) =>
                    handleAvailabilityChange(ingredient.id, !!checked) // Pass boolean
                  }
                  aria-labelledby={`${ingredient.id}-label`}
                  disabled={isGenerating}
                />
                <Label
                  htmlFor={ingredient.id}
                  id={`${ingredient.id}-label`}
                  className={`flex-1 text-sm font-medium ${!ingredient.available ? 'text-muted-foreground line-through' : 'text-foreground'}`}
                >
                  {ingredient.name}
                </Label>
              </div>
            ))}
          </CardContent>
           <CardFooter>
             <Button
               type="button"
               onClick={handleGenerateClick}
               className="w-full bg-accent text-accent-foreground hover:bg-accent/90 focus:ring-accent"
               disabled={isGenerating || isListening || !parsedIngredients.some(ing => ing.available)} // Disable if no ingredients are available
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
      )}
    </div>
  );
}
