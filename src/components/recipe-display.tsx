
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
import { Loader2, Sparkles, List, CookingPot, TriangleAlert, CheckSquare } from 'lucide-react'; // Updated icons
import { ScrollArea } from '@/components/ui/scroll-area'; // Added ScrollArea

interface RecipeDisplayProps {
  recipe: GenerateRecipeOutput; // The initial generated recipe
  refinedRecipe: RefineRecipeOutput | null; // The refined recipe, if available
  onRefine: (unavailableAdditional: string[]) => void; // Callback to trigger refinement
  isRefining: boolean; // State for loading indicator during refinement
}

// Interface for the state tracking availability of *additional* ingredients
interface AdditionalIngredientItem {
    id: string;
    name: string;
    available: boolean; // Tracks user confirmation for additional items
}

export function RecipeDisplay({ recipe, refinedRecipe, onRefine, isRefining }: RecipeDisplayProps) {
  const [additionalIngredientsChecklist, setAdditionalIngredientsChecklist] = useState<AdditionalIngredientItem[]>([]);
  const [showRefineSection, setShowRefineSection] = useState(false);
  const [refineError, setRefineError] = useState<string | null>(null);

   // Effect to initialize or update the checklist for *additional* ingredients
   // This runs when the *original* recipe changes OR when a refinement happens (to potentially reset)
  useEffect(() => {
    // Only populate the checklist based on the *original* recipe's additional ingredients
    // If a refined recipe exists, we don't show the checklist anymore.
    if (recipe && !refinedRecipe && recipe.additionalIngredients && recipe.additionalIngredients.length > 0) {
      const initialItems = recipe.additionalIngredients.map((name, index) => ({
        id: `add-ing-${index}-${recipe.recipeName}-${Date.now()}`, // More unique ID incorporating recipe name
        name: name,
        available: true, // Default to available for the checklist
      }));
      setAdditionalIngredientsChecklist(initialItems);
      setShowRefineSection(true); // Show the checklist section
      setRefineError(null); // Clear previous errors when original recipe loads
    } else {
      // If there's a refined recipe, or no additional ingredients, hide the checklist
      setAdditionalIngredientsChecklist([]);
      setShowRefineSection(false);
    }

    // Clear refinement-specific error when the base recipe changes
    if (!refinedRecipe) {
        setRefineError(null);
    }

  }, [recipe, refinedRecipe]); // Dependencies: original recipe and refined recipe

  // Handles changes in the *additional* ingredients checklist
  const handleAvailabilityChange = (id: string, checked: boolean) => {
    setAdditionalIngredientsChecklist(prev =>
      prev.map(ing =>
        ing.id === id ? { ...ing, available: checked } : ing
      )
    );
     setRefineError(null); // Clear error when user interacts with checklist
  };

  // Triggers the refine flow based on the checklist state
  const handleRefineClick = () => {
    setRefineError(null);
    const unavailable = additionalIngredientsChecklist
      .filter(ing => !ing.available)
      .map(ing => ing.name);

    // Call the onRefine passed from the parent component
    onRefine(unavailable);
  };

   // Helper to format ingredients list (used for both initial and refined)
   const formatIngredientsList = (provided: string[] | undefined, additional: string[] | undefined) => {
       if (!provided && !additional) return <p>No ingredients listed.</p>;

       const providedItems = provided && provided.length > 0 ? provided : [];
       const additionalItems = additional && additional.length > 0 ? additional : [];

       return (
            <div className="space-y-2">
                {providedItems.length > 0 && (
                    <div>
                        <p className="font-medium text-foreground/90">Main Ingredients:</p>
                        <ul className="list-disc list-inside text-muted-foreground pl-2">
                            {providedItems.map((item, index) => <li key={`prov-${index}`}>{item}</li>)}
                        </ul>
                    </div>
                )}
                 {additionalItems.length > 0 && (
                    <div>
                        <p className="font-medium text-foreground/90 mt-1">Additional Ingredients:</p>
                        <ul className="list-disc list-inside text-muted-foreground pl-2">
                            {additionalItems.map((item, index) => <li key={`add-${index}`}>{item}</li>)}
                        </ul>
                    </div>
                )}
                 {providedItems.length === 0 && additionalItems.length === 0 && (
                     <p className="text-muted-foreground italic">Ingredient details not available.</p>
                 )}
            </div>
       );
   };

   // Helper function to format multiline instructions text
   const formatInstructions = (text: string | null | undefined) => {
        if (!text) return <p className="text-muted-foreground italic">No instructions provided.</p>;

        const lines = text.split('\n').map(line => line.trim()).filter(line => line !== '');

        if (lines.length === 0) return <p className="text-muted-foreground italic">No instructions provided.</p>;

        // Check if lines look like a numbered list
        const isNumberedList = lines.length > 1 && lines.every(line => /^\d+[\.\)]\s/.test(line));

        if (isNumberedList) {
        return (
            <ol className="list-decimal list-outside space-y-1.5 pl-5">
            {lines.map((line, index) => (
                // Remove the number prefix for display within the <ol>
                <li key={index}>{line.replace(/^\d+[\.\)]\s/, '')}</li>
            ))}
            </ol>
        );
        }

        // Otherwise, treat as paragraphs separated by original newlines
        return <div className="space-y-2">{lines.map((line, index) => <p key={index}>{line}</p>)}</div>;
    };

    // Determine which recipe data to display based on whether `refinedRecipe` exists
    const displayData = refinedRecipe ? {
        name: refinedRecipe.refinedRecipeName,
        // Refined recipe's ingredients field is a pre-formatted string. We'll display it directly.
        // If more structure is needed, the refine flow's output schema should change.
        ingredientsComponent: <div className="text-muted-foreground space-y-1 prose prose-sm max-w-none">{formatInstructions(refinedRecipe.refinedIngredients)}</div>,
        instructionsComponent: formatInstructions(refinedRecipe.refinedInstructions),
        notes: refinedRecipe.feasibilityNotes,
    } : {
        name: recipe.recipeName,
        ingredientsComponent: formatIngredientsList(recipe.providedIngredients, recipe.additionalIngredients),
        instructionsComponent: formatInstructions(recipe.instructions),
        notes: recipe.notes,
    };

    // Checklist should only show if we have the *original* recipe and it *has* additional ingredients
    const showChecklist = !refinedRecipe && showRefineSection && additionalIngredientsChecklist.length > 0;


  return (
    <Card className="w-full border-none shadow-none bg-transparent flex flex-col h-full">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="text-xl font-semibold text-primary mb-1">{displayData.name}</CardTitle>
         {/* Display notes */}
         {displayData.notes && (
            <CardDescription className="text-xs italic mt-1">
                Note: {displayData.notes}
            </CardDescription>
         )}
      </CardHeader>

      {/* Use ScrollArea for content */}
       <ScrollArea className="flex-grow pr-3"> {/* Added pr-3 for scrollbar spacing */}
         <CardContent className="p-0 space-y-4 text-sm ">
            {/* Ingredients Section */}
            <div>
              <h3 className="font-semibold text-foreground mb-2 flex items-center"><List className="h-4 w-4 mr-2 text-accent"/>Ingredients</h3>
              {displayData.ingredientsComponent}
            </div>

             {/* Refinement Checklist Section */}
            {showChecklist && (
                <>
                 <Separator className="my-3"/>
                 <div className="space-y-3 rounded-md border border-dashed border-border p-3 bg-secondary/20">
                     <h3 className="font-semibold text-foreground flex items-center text-base">
                         <CheckSquare className="h-5 w-5 mr-2 text-accent"/> Review Additional Items
                     </h3>
                     <p className="text-xs text-muted-foreground">
                         The chef suggested these extra items. Uncheck any you don't have, then click "Refine Recipe".
                     </p>
                     <div className="space-y-2 max-h-32 overflow-y-auto pr-2"> {/* Limited height */}
                        {additionalIngredientsChecklist.map((ingredient) => (
                        <div key={ingredient.id} className="flex items-center space-x-3 p-1 rounded-md hover:bg-background/50">
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
                        <Alert variant="destructive" className="mt-2 text-xs">
                            <TriangleAlert className="h-3 w-3" />
                            <AlertTitle className="text-xs font-medium">Refinement Info</AlertTitle>
                            <AlertDescription className="text-xs">{refineError}</AlertDescription>
                        </Alert>
                     )}
                     <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefineClick}
                        disabled={isRefining}
                        className="mt-2 border-primary text-primary hover:bg-primary/10 w-full sm:w-auto"
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
                            Refine Recipe
                            </>
                        )}
                     </Button>
                 </div>
                </>
            )}

            {/* Instructions Section */}
            <Separator className="my-3"/>
            <div>
              <h3 className="font-semibold text-foreground mb-2 flex items-center"><CookingPot className="h-4 w-4 mr-2 text-accent"/>Instructions</h3>
               {/* Use prose for better text formatting */}
               <div className="text-muted-foreground space-y-2 prose prose-sm max-w-none prose-li:my-0.5 prose-p:my-1">
                 {displayData.instructionsComponent}
               </div>
            </div>

         </CardContent>
       </ScrollArea>
    </Card>
  );
}
