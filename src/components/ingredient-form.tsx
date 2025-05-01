// IngredientForm component
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from "@/components/ui/switch"; // Import Switch
import { Loader2, ChefHat, Utensils, AlertCircle } from 'lucide-react'; // Removed Mic, MicOff
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';


interface IngredientFormProps {
  onSubmit: (ingredientsString: string) => void;
  isGenerating: boolean;
}

// Removed SpeechRecognition related code

export function IngredientForm({ onSubmit, isGenerating }: IngredientFormProps) {
  const { toast } = useToast();
  const [ingredientsInput, setIngredientsInput] = useState<string>('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [isVoiceChatEnabled, setIsVoiceChatEnabled] = useState(false); // State for the switch

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

  // Removed useEffect hook for speech recognition

  // Removed handleVoiceInput function

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
              placeholder={isVoiceChatEnabled ? "Voice chat mode active..." : "Type your ingredients..."}
              className={`resize-none min-h-[80px] bg-background focus:ring-primary ${inputError ? 'border-destructive focus:ring-destructive' : ''}`} // Add error state styling, removed pr-12
              value={ingredientsInput}
              onChange={(e) => { setIngredientsInput(e.target.value); setInputError(null); }} // Clear error on change
              aria-label="Enter available ingredients separated by commas"
              aria-invalid={!!inputError} // Indicate invalid state for accessibility
              aria-describedby="input-error-msg"
              disabled={isVoiceChatEnabled} // Optionally disable textarea when voice chat is on
            />
            {/* Removed Mic button */}
          </div>
           {/* Input Error Display */}
           {inputError && (
                <p id="input-error-msg" className="text-sm font-medium text-destructive flex items-center mt-1">
                    <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                    {inputError}
                </p>
            )}
           {/* Removed Speech Error Display */}

           {/* Voice Chat Switch */}
            <div className="flex items-center space-x-2 pt-2">
                <Switch
                    id="voice-chat-switch"
                    checked={isVoiceChatEnabled}
                    onCheckedChange={setIsVoiceChatEnabled}
                    disabled={isGenerating} // Disable if generating recipe
                    aria-label="Toggle Interactive Voice Chat"
                />
                <Label htmlFor="voice-chat-switch" className="text-sm font-medium text-muted-foreground cursor-pointer">
                    Interactive Voice Chat
                </Label>
            </div>
             {/* Placeholder for Voice Chat UI/Logic */}
             {isVoiceChatEnabled && (
                <div className="text-sm text-primary italic p-2 border border-dashed border-primary/50 rounded-md bg-primary/10">
                    {/* Voice Chat Interface would go here */}
                    Voice chat interaction elements will appear here when implemented.
                </div>
             )}
        </CardContent>
        <CardFooter>
           {/* Generate Recipe Button */}
           <Button
             type="button"
             onClick={handleGenerateClick}
             className="w-full bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary" // Use primary color
             disabled={isGenerating || isVoiceChatEnabled} // Disable if voice chat is enabled or generating
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
