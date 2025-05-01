// IngredientForm component
'use client';

import React, { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, ChefHat, Mic, MicOff } from 'lucide-react';
import { useToast } from "@/hooks/use-toast"; // Import useToast

const ingredientFormSchema = z.object({
  ingredients: z.string().min(3, {
    message: 'Please list at least one ingredient.',
  }),
});

export type IngredientFormData = z.infer<typeof ingredientFormSchema>;

interface IngredientFormProps {
  onSubmit: (data: IngredientFormData) => void;
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
  const form = useForm<IngredientFormData>({
    resolver: zodResolver(ingredientFormSchema),
    defaultValues: {
      ingredients: '',
    },
  });
  const { toast } = useToast(); // Initialize toast
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const handleFormSubmit: SubmitHandler<IngredientFormData> = (data) => {
    onSubmit(data);
  };

   // Effect to handle recognition events
  useEffect(() => {
    if (!recognition) return;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      const currentIngredients = form.getValues('ingredients');
      form.setValue('ingredients', currentIngredients ? `${currentIngredients}, ${transcript}` : transcript, { shouldValidate: true });
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
      // Ensure listening state is false when recognition ends naturally
      if (isListening) {
        setIsListening(false);
      }
    };

    // Cleanup function to stop recognition if component unmounts while listening
    return () => {
      if (recognition && isListening) {
        recognition.stop();
        setIsListening(false);
      }
    };
  }, [form, isListening, toast]); // Add toast to dependency array


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
      setSpeechError(null); // Clear previous errors
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="ingredients"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground font-medium">Available Ingredients</FormLabel>
              <div className="relative">
                <FormControl>
                  <Textarea
                    placeholder="e.g., chicken breast, broccoli, soy sauce, garlic, rice... or use the mic!"
                    className="resize-none min-h-[100px] bg-secondary/50 focus:bg-background focus:ring-accent pr-12" // Added padding-right for mic button space
                    {...field}
                    aria-label="Enter available ingredients separated by commas, or use the microphone button"
                  />
                </FormControl>
                 {SpeechRecognition && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleVoiceInput}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-1 ${isListening ? 'text-destructive' : 'text-muted-foreground hover:text-primary'}`}
                      aria-label={isListening ? "Stop listening" : "Start voice input"}
                      disabled={isGenerating} // Disable mic if recipe is generating
                    >
                      {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </Button>
                 )}
              </div>
               {speechError && <p className="text-sm font-medium text-destructive mt-1">{speechError}</p>}
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
            type="submit"
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 focus:ring-accent"
            disabled={isGenerating || isListening} // Disable submit while listening
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
      </form>
    </Form>
  );
}