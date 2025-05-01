
'use client';
import React, { useState, useEffect } from 'react';
import { type GenerateRecipeOutput } from '@/ai/flows/generate-recipe';
import { type RefineRecipeOutput } from '@/ai/flows/refine-recipe';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Sparkles, BookOpen, TriangleAlert, CheckSquare, Square } from 'lucide-react';

interface RecipeDisplayProps {
  recipe: GenerateRecipeOutput;
  refinedRecipe: RefineRecipeOutput | null; // Receive refined recipe if available
  onRefine: (unavailableAdditional: string[]) => void; // Callback to trigger refinement
  isRefining: boolean; // State for loading indicator during refinement
}

interface AdditionalIngredientItem {
    id: string;
    name: string;
    available: boolean;
}

export function RecipeDisplay({ recipe, refinedRecipe, onRefine, isRefining }: RecipeDisplayProps) {
  const [additionalIngredients, setAdditionalIngredients] = useState<AdditionalIngredientItem[]>([]);
  const [showRefineSection, setShowRefineSection] = useState(false);
  const [refineError, setRefineError] = useState<string | null>(null);

   // Populate additional ingredients checklist when the original recipe is loaded
  useEffect(() => {
    if (recipe && recipe.additionalIngredients && recipe.additionalIngredients.length > 0) {
      const initialItems = recipe.additionalIngredients.map((name, index) => ({
        id: `add-ing-${index}-${Date.now()}`,
        name: name,
        available: true, // Default to available
      }));
      setAdditionalIngredients(initialItems);
      setShowRefineSection(true); // Show the refine section if there are additional ingredients
      setRefineError(null); // Clear previous errors
    } else {
      setAdditionalIngredients([]); // Clear if no additional ingredients
      setShowRefineSection(false); // Hide section if no additional ingredients
    }
    // Reset refined recipe specific state when original recipe changes
    setRefineError(null);

  }, [recipe]); // Dependency on the original recipe

  const handleAvailabilityChange = (id: string, checked: boolean) => {
    setAdditionalIngredients(prev =>
      prev.map(ing =>
        ing.id === id ? { ...ing, available: checked } : ing
      )
    );
  };

  const handleRefineClick = () => {
    setRefineError(null);
    const unavailable = additionalIngredients
      .filter(ing => !ing.available)
      .map(ing => ing.name);

    // Only call refine if there are actually unavailable items or if it's the first time clicking
    if (unavailable.length > 0 || !refinedRecipe) {
         onRefine(unavailable);
    } else {
        // If nothing is unavailable and we already have a refined recipe (likely just confirming),
        // we might not need to call the AI again.
        // However, the current `refineRecipe` flow handles the "no unavailable" case,
        // so calling it is fine and confirms the state.
         onRefine(unavailable);
         // Or display a message:
         // setRefineError("No changes needed, all additional ingredients are marked available.");
    }
  };

   // Helper function to format multiline text or array of strings
   const formatTextList = (text: string | string[] | null | undefined) => {
        if (!text) return null;

        const lines = Array.isArray(text) ? text : text.split('\n').filter(line => line.trim() !== '');

        if (lines.length === 0) return null;

        // Check if lines look like numbered list items
        const isNumberedList = lines.every(line => /^\d+[\.\)]\s/.test(line.trim()));

        if (isNumberedList) {
        return (
            <ol className="list-decimal list-inside space-y-1">
            {lines.map((line, index) => (
                <li key={index}>{line.replace(/^\d+[\.\)]\s/, '')}</li>
            ))}
            </ol>
        );
        }

        // Simple list for arrays
        if (Array.isArray(text)) {
             return (
                <ul className="list-disc list-inside space-y-1">
                    {lines.map((line, index) => <li key={index}>{line}</li>)}
                </ul>
             );
        }

        // Otherwise, treat as paragraphs
        return lines.map((line, index) => <p key={index}>{line}</p>);
    };

    // Determine which recipe data to display
    const displayData = refinedRecipe ? {
        name: refinedRecipe.refinedRecipeName,
        // For refined recipe, 'refinedIngredients' is a formatted string
        // We need to potentially split it or format it if needed, or just display as is.
        // Let's assume it's pre-formatted for now.
        ingredients: refinedRecipe.refinedIngredients,
        instructions: refinedRecipe.refinedInstructions,
        notes: refinedRecipe.feasibilityNotes,
    } : {
        name: recipe.recipeName,
        // Combine provided and additional for initial display, maybe with labels
        ingredients: `**Provided:**\n${recipe.providedIngredients.join(', ')}\n**Additional:**\n${recipe.additionalIngredients.join(', ')}`,
        instructions: recipe.instructions,
        notes: recipe.notes,
    };

    const showChecklist = !refinedRecipe && showRefineSection && additionalIngredients.length > 0;


  return (
    <Card className="w-full border-none shadow-none bg-transparent">
      <CardHeader className="p-0 mb-4">
        {/* Display refined name if available, else original */}
        <CardTitle className="text-xl font-semibold text-primary mb-1">{displayData.name}</CardTitle>
         {/* Display notes if available */}
         {displayData.notes && (
            <CardDescription className="text-xs italic mt-1">
                Note: {displayData.notes}
            </CardDescription>
         )}
      </CardHeader>
      <CardContent className="p-0 space-y-4 text-sm">
        <div>
          <h3 className="font-semibold text-foreground mb-2 flex items-center"><BookOpen className="h-4 w-4 mr-2 text-accent"/>Ingredients:</h3>
          {/* Display combined/formatted ingredients */}
          <div className="text-muted-foreground space-y-1 prose prose-sm max-w-none">
            {formatTextList(displayData.ingredients)}
           </div>
        </div>

        {/* Additional Ingredients Checklist (Only show if NOT refined and additional ingredients exist) */}
        {showChecklist && (
            <>
             <Separator />
             <div className="space-y-3">
                 <h3 className="font-semibold text-foreground flex items-center">
                     <CheckSquare className="h-4 w-4 mr-2 text-accent"/> Review Additional Ingredients:
                 </h3>
                 <p className="text-xs text-muted-foreground">Uncheck any of these you don't have, then click "Refine with AI".</p>
                 <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                    {additionalIngredients.map((ingredient) => (
                    <div key={ingredient.id} className="flex items-center space-x-3 p-1.5 rounded-md hover:bg-secondary/50">
                        <Checkbox
                        id={ingredient.id}
                        checked={ingredient.available}
                        onCheckedChange={(checked) =>
                            handleAvailabilityChange(ingredient.id, !!checked)
                        }
                        aria-labelledby={`${ingredient.id}-label`}
                        disabled={isRefining}
                        />
                        <Label
                        htmlFor={ingredient.id}
                        id={`${ingredient.id}-label`}
                        className={`flex-1 text-sm font-medium cursor-pointer ${!ingredient.available ? 'text-muted-foreground line-through' : 'text-foreground'}`}
                        >
                        {ingredient.name}
                        </Label>
                    </div>
                    ))}
                 </div>
                 {refineError && (
                    <Alert variant="destructive" className="mt-2">
                        <TriangleAlert className="h-4 w-4" />
                        <AlertTitle>Refinement Info</AlertTitle>
                        <AlertDescription>{refineError}</AlertDescription>
                    </Alert>
                 )}
                 <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefineClick}
                    disabled={isRefining}
                    className="mt-2 border-accent text-accent hover:bg-accent/10 w-full sm:w-auto"
                    aria-live="polite"
                 >
                    {isRefining ? (
                        <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Refining...
                        </>
                    ) : (
                        <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        {refinedRecipe ? 'Update Refinement' : 'Refine with AI'}
                        </>
                    )}
                 </Button>
             </div>
            </>
        )}

        <Separator />
        <div>
          <h3 className="font-semibold text-foreground mb-2 flex items-center"><BookOpen className="h-4 w-4 mr-2 text-accent"/>Instructions:</h3>
           {/* Display refined instructions if available, else original */}
           <div className="text-muted-foreground space-y-2 prose prose-sm max-w-none">
            {formatTextList(displayData.instructions)}
           </div>
        </div>

      </CardContent>
    </Card>
  );
}
