
'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { IngredientForm } from '@/components/ingredient-form';
import { RecipeDisplay } from '@/components/recipe-display';
import { generateRecipe, type GenerateRecipeOutput } from '@/ai/flows/generate-recipe';
import { refineRecipe, type RefineRecipeInput, type RefineRecipeOutput } from '@/ai/flows/refine-recipe'; // Import refine flow
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, UtensilsCrossed, TriangleAlert } from 'lucide-react';
import Image from 'next/image';

// State for the main recipe generation result
type RecipeState = GenerateRecipeOutput | null;
// State for the refined recipe result
type RefinedRecipeState = RefineRecipeOutput | null;

export default function Home() {
  const [recipe, setRecipe] = useState<RecipeState>(null);
  const [refinedRecipe, setRefinedRecipe] = useState<RefinedRecipeState>(null); // State for refined recipe
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, startGenerating] = useTransition();
  const [isRefining, startRefining] = useTransition(); // Transition for refining
  const [latestSubmittedIngredientsString, setLatestSubmittedIngredientsString] = useState<string>(''); // Store raw ingredient string


  // Handler for initial recipe generation
  const handleGenerateRecipe = async (ingredientsString: string) => {
    setError(null);
    setRecipe(null);
    setRefinedRecipe(null); // Clear refined recipe too
    setLatestSubmittedIngredientsString(ingredientsString); // Store the submitted string

     // Input validation is now simpler as the form provides the string
     if (!ingredientsString) {
       setError("No ingredients provided. Please list the ingredients you have.");
       return;
     }

    startGenerating(async () => {
      try {
        // Pass the raw string directly to the flow
        const result = await generateRecipe({ ingredients: ingredientsString });

        if (result && (result.recipeName === "Generation Failed" || result.recipeName === "AI Error" || result.recipeName === "Input Error")) {
             setError(result.additionalIngredients.join(' ') || result.notes || 'Failed to generate recipe due to an AI or input error.');
             setRecipe(null);
        } else if (result) {
           // Check if the AI indicated no recipe could be made
           if (result.recipeName.includes("Recipe Idea Blocked") || result.recipeName.includes("Unable to Create")) {
                setError(result.notes || "The AI couldn't create a recipe with the provided ingredients, even considering common staples.");
                setRecipe(null); // Explicitly clear recipe state
           } else {
               setRecipe(result);
           }
        } else {
          setError('Could not generate a recipe. The AI might be unavailable or the request failed unexpectedly.');
        }
      } catch (e) {
        console.error('Error generating recipe:', e);
        if (e instanceof Error) {
          setError(`An unexpected error occurred: ${e.message}. Please try again later.`);
        } else {
          setError('An unexpected error occurred while generating the recipe. Please try again later.');
        }
      }
    });
  };

   // Handler for refining the recipe based on unavailable additional ingredients
  const handleRefineRecipe = async (unavailableAdditional: string[]) => {
    if (!recipe) {
      setError("Cannot refine recipe - no initial recipe generated.");
      return;
    }
    setError(null); // Clear previous errors
    setRefinedRecipe(null); // Clear previous refinement

    // The `providedIngredients` for the refine flow should be the list that the *AI* used from the initial prompt.
    // This is now available directly in the `recipe.providedIngredients` output field.
    const providedIngredientsFromRecipe = recipe.providedIngredients || [];

    const refineInput: RefineRecipeInput = {
      originalRecipeName: recipe.recipeName,
      providedIngredients: providedIngredientsFromRecipe, // Use the list from the AI's output
      originalAdditionalIngredients: recipe.additionalIngredients || [], // Ensure it's an array
      unavailableAdditionalIngredients: unavailableAdditional,
      originalInstructions: recipe.instructions,
    };

    startRefining(async () => {
      try {
        const result = await refineRecipe(refineInput);

        if (result && (result.refinedRecipeName.includes("Failed") || result.refinedRecipeName.includes("AI Error") || result.refinedRecipeName.includes("Difficult"))) {
           setError(result.feasibilityNotes || 'Failed to refine recipe due to an AI or input error.');
           setRefinedRecipe(null); // Keep showing original recipe if refinement fails
        } else if (result) {
          setRefinedRecipe(result);
        } else {
           setError('Could not refine the recipe. The AI might be unavailable or the request failed unexpectedly.');
        }

      } catch (e) {
         console.error('Error refining recipe:', e);
          if (e instanceof Error) {
            setError(`An unexpected error occurred during refinement: ${e.message}. Please try again later.`);
          } else {
            setError('An unexpected error occurred while refining the recipe. Please try again later.');
          }
      }
    });
  };

  const isLoading = isGenerating || isRefining; // Combined loading state

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 md:p-8 lg:p-12 bg-background">
      <header className="w-full max-w-4xl mb-8 text-center">
         <div className="flex justify-center items-center gap-4 mb-4">
          <UtensilsCrossed className="h-10 w-10 text-primary" />
          <h1 className="text-4xl font-bold text-primary tracking-tight">FridgeChef</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Tell us what's in your fridge, and we'll whip up a recipe for you!
        </p>
      </header>

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Ingredient Form Card */}
        <Card className="shadow-lg rounded-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-primary">Your Ingredients</CardTitle>
            <CardDescription>
              Enter ingredients separated by commas and generate!
            </CardDescription>
          </CardHeader>
          <CardContent>
             {/* Pass the updated handler, disable form if loading */}
            <IngredientForm onSubmit={handleGenerateRecipe} isGenerating={isLoading} />
          </CardContent>
        </Card>

        {/* Recipe Display Card */}
        <Card className="shadow-lg rounded-lg flex flex-col min-h-[300px] justify-between">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-primary">Suggested Recipe</CardTitle>
             {/* Updated CardDescription logic */}
             {!isLoading && !error && (recipe || refinedRecipe) && (
                <CardDescription>
                    {refinedRecipe ? "Refined recipe based on your feedback." : (recipe ? "Generated based on your ingredients." : "")}
                    {/* Show notes based on which recipe is active */}
                    {(refinedRecipe?.feasibilityNotes || recipe?.notes) && (
                         <span className="block mt-1 text-xs italic">
                            Note: {refinedRecipe?.feasibilityNotes || recipe?.notes}
                         </span>
                    )}
                </CardDescription>
             )}
              {/* Description when no recipe/loading/error */}
             {!recipe && !refinedRecipe && !isLoading && !error && (
                <CardDescription>
                    Your generated recipe will appear here.
                </CardDescription>
             )}
             {isLoading && (
                 <CardDescription>
                    Please wait while the chef is thinking...
                 </CardDescription>
             )}
             {error && !isLoading && (
                 <CardDescription className="text-destructive">
                    There was an issue generating or refining the recipe.
                 </CardDescription>
             )}
          </CardHeader>
          <CardContent className="flex-grow flex items-center justify-center">
            {isLoading ? (
              <div className="flex flex-col items-center text-muted-foreground">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p>{isGenerating ? 'Generating your delicious recipe...' : 'Refining the recipe...'}</p>
              </div>
            ) : error ? (
               <Alert variant="destructive" className="w-full">
                  <TriangleAlert className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
               </Alert>
            ) : recipe ? ( // Display RecipeDisplay if 'recipe' exists (refined or not)
              <RecipeDisplay
                recipe={recipe} // Always pass the original recipe
                refinedRecipe={refinedRecipe} // Pass refined recipe (null if not refined yet)
                onRefine={handleRefineRecipe} // Pass refine handler
                isRefining={isRefining} // Pass refining state
              />
            ) : (
              // Initial placeholder state
              <div className="text-center text-muted-foreground space-y-4">
                 <Image
                    src="https://picsum.photos/seed/recipebook/300/200"
                    alt="Empty plate waiting for a recipe"
                    width={300}
                    height={200}
                    className="rounded-lg mx-auto shadow-md"
                    data-ai-hint="recipe book cooking illustration chef"
                    priority // Prioritize loading the initial image
                  />
                <p>Enter ingredients, click "Generate Recipe", and see what the AI chef suggests!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} FridgeChef. Powered by AI.</p>
      </footer>
    </main>
  );
}
