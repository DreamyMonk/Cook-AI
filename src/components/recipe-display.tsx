'use client';
import React, { useState, useTransition } from 'react';
import { type GenerateRecipeOutput } from '@/ai/flows/generate-recipe';
import { improveRecipeInstruction, type ImproveRecipeInstructionOutput } from '@/ai/flows/improve-recipe-instruction';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Sparkles, BookOpen, TriangleAlert } from 'lucide-react';

interface RecipeDisplayProps {
  recipe: GenerateRecipeOutput;
}

export function RecipeDisplay({ recipe }: RecipeDisplayProps) {
  const [improvedInstructions, setImprovedInstructions] = useState<string | null>(null);
  const [isImproving, startTransition] = useTransition();
  const [improveError, setImproveError] = useState<string | null>(null);

  const handleImproveInstructions = () => {
    setImproveError(null);
    startTransition(async () => {
      try {
        const result: ImproveRecipeInstructionOutput = await improveRecipeInstruction({
          recipeName: recipe.recipeName,
          originalInstructions: recipe.instructions,
        });
        if (result && result.improvedInstructions) {
          setImprovedInstructions(result.improvedInstructions);
        } else {
           setImproveError('Could not improve instructions. The AI might be unavailable.');
        }
      } catch (e) {
        console.error('Error improving instructions:', e);
        setImproveError('An unexpected error occurred while improving instructions.');
      }
    });
  };

   // Helper function to format multiline text
   const formatMultilineText = (text: string | null | undefined) => {
    if (!text) return null;
    // Split by newline and filter empty lines, then map to paragraphs or list items
    // Check if lines look like numbered list items (start with number and period/parenthesis)
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const isNumberedList = lines.every(line => /^\d+[\.\)]\s/.test(line.trim()));

    if (isNumberedList) {
      return (
        <ol className="list-decimal list-inside space-y-1">
          {lines.map((line, index) => (
            <li key={index}>{line.replace(/^\d+[\.\)]\s/, '')}</li> // Remove the number/period
          ))}
        </ol>
      );
    }

     // Otherwise, treat as paragraphs
     return lines.map((line, index) => <p key={index}>{line}</p>);
  };

  return (
    <Card className="w-full border-none shadow-none bg-transparent">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="text-xl font-semibold text-primary mb-1">{recipe.recipeName}</CardTitle>
      </CardHeader>
      <CardContent className="p-0 space-y-4 text-sm">
        <div>
          <h3 className="font-semibold text-foreground mb-2 flex items-center"><BookOpen className="h-4 w-4 mr-2 text-accent"/>Ingredients:</h3>
          <div className="text-muted-foreground space-y-1">
            {formatMultilineText(recipe.ingredients)}
           </div>
        </div>
        <Separator />
        <div>
          <h3 className="font-semibold text-foreground mb-2 flex items-center"><BookOpen className="h-4 w-4 mr-2 text-accent"/>Instructions:</h3>
           <div className="text-muted-foreground space-y-2">
            {formatMultilineText(improvedInstructions ?? recipe.instructions)}
           </div>
           {improveError && (
             <Alert variant="destructive" className="mt-4">
                <TriangleAlert className="h-4 w-4" />
                <AlertTitle>Improvement Error</AlertTitle>
                <AlertDescription>{improveError}</AlertDescription>
             </Alert>
           )}
           {!improvedInstructions && (
             <Button
              variant="outline"
              size="sm"
              onClick={handleImproveInstructions}
              disabled={isImproving}
              className="mt-4 border-accent text-accent hover:bg-accent/10"
              aria-live="polite"
             >
              {isImproving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Improving...
                </>
              ) : (
                 <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Improve Instructions with AI
                 </>
              )}
             </Button>
           )}
        </div>

      </CardContent>
    </Card>
  );
}
