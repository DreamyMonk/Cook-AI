
'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { IngredientForm } from '@/components/ingredient-form';
import { RecipeDisplay } from '@/components/recipe-display';
import { generateRecipe, type GenerateRecipeOutput } from '@/ai/flows/generate-recipe';
import { refineRecipe, type RefineRecipeInput, type RefineRecipeOutput } from '@/ai/flows/refine-recipe';
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
  const [refinedRecipe, setRefinedRecipe] = useState<RefinedRecipeState>(null);
  const [alternativeTypes, setAlternativeTypes] = useState<string[] | null>(null); // State for alternative dish types
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, startGenerating] = useTransition();
  const [isRefining, startRefining] = useTransition();
  const [latestSubmittedIngredientsString, setLatestSubmittedIngredientsString] = useState<string>('');


  // Handler for initial recipe generation (and handling alternatives)
  const handleGenerateRecipe = async (ingredientsString: string, preferredType?: string) => {
    setError(null);
    setRecipe(null);
    setRefinedRecipe(null);
    setAlternativeTypes(null); // Clear alternatives
    if (!preferredType) { // Only update latest ingredients if it's a new primary generation
        setLatestSubmittedIngredientsString(ingredientsString);
    }

     if (!ingredientsString) {
       setError("No ingredients provided. Please list the ingredients you have.");
       return;
     }

    startGenerating(async () => {
      try {
        // Pass ingredients and optional preferred type
        const result = await generateRecipe({ ingredients: ingredientsString, preferredDishType: preferredType });

        if (result && (result.recipeName === "Generation Failed" || result.recipeName === "AI Error" || result.recipeName === "Input Error")) {
             setError(result.notes || 'Failed to generate recipe due to an AI or input error.');
             setRecipe(null);
             setAlternativeTypes(null);
        } else if (result) {
           if (result.recipeName.includes("Recipe Idea Blocked") || result.recipeName.includes("Unable to Create")) {
                setError(result.notes || "The AI couldn't create a recipe with the provided ingredients.");
                setRecipe(null);
                setAlternativeTypes(null);
           } else {
               setRecipe(result);
               // Store alternative types if provided and if it was the initial generation (no preferred type)
               if (!preferredType && result.alternativeDishTypes && result.alternativeDishTypes.length > 0) {
                   setAlternativeTypes(result.alternativeDishTypes);
               } else {
                    setAlternativeTypes(null); // Clear if generating for a specific type or no alternatives given
               }
           }
        } else {
          setError('Could not generate a recipe. The AI might be unavailable or the request failed unexpectedly.');
          setAlternativeTypes(null);
        }
      } catch (e) {
        console.error('Error generating recipe:', e);
        if (e instanceof Error) {
          setError(`An unexpected error occurred: ${e.message}. Please try again later.`);
        } else {
          setError('An unexpected error occurred while generating the recipe. Please try again later.');
        }
         setAlternativeTypes(null);
      }
    });
  };

  // Handler to generate a recipe for one of the alternative types
  const handleGenerateAlternative = (dishType: string) => {
      if (!latestSubmittedIngredientsString) {
          setError("Cannot generate alternative - original ingredients list is missing.");
          return;
      }
      // Call the main generation function, but pass the selected dish type
      handleGenerateRecipe(latestSubmittedIngredientsString, dishType);
  };


   // Handler for refining the recipe based on unavailable additional ingredients
  const handleRefineRecipe = async (unavailableAdditional: string[]) => {
    if (!recipe) {
      setError("Cannot refine recipe - no initial recipe generated.");
      return;
    }
    setError(null);
    setRefinedRecipe(null);

    const providedIngredientsFromRecipe = recipe.providedIngredients || [];

    const refineInput: RefineRecipeInput = {
      originalRecipeName: recipe.recipeName,
      providedIngredients: providedIngredientsFromRecipe,
      originalAdditionalIngredients: recipe.additionalIngredients || [],
      unavailableAdditionalIngredients: unavailableAdditional,
      originalInstructions: recipe.instructions,
    };

    startRefining(async () => {
      try {
        const result = await refineRecipe(refineInput);

        if (result && (result.refinedRecipeName.includes("Failed") || result.refinedRecipeName.includes("AI Error") || result.refinedRecipeName.includes("Difficult"))) {
           setError(result.feasibilityNotes || 'Failed to refine recipe due to an AI or input error.');
           setRefinedRecipe(null);
        } else if (result) {
          setRefinedRecipe(result);
          setAlternativeTypes(null); // Hide alternatives once refinement is successful
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

  const isLoading = isGenerating || isRefining;

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
             {/* Pass the standard handler (without preferred type initially) */}
            <IngredientForm onSubmit={(ingredients) => handleGenerateRecipe(ingredients)} isGenerating={isLoading} />
          </CardContent>
        </Card>

        {/* Recipe Display Card */}
        <Card className="shadow-lg rounded-lg flex flex-col min-h-[300px] justify-between">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-primary">Suggested Recipe</CardTitle>
             {!isLoading && !error && (recipe || refinedRecipe) && (
                <CardDescription>
                    {refinedRecipe ? "Refined recipe based on your feedback." : (recipe ? "Generated based on your ingredients." : "")}
                    {(refinedRecipe?.feasibilityNotes || recipe?.notes) && (
                         <span className="block mt-1 text-xs italic">
                            Note: {refinedRecipe?.feasibilityNotes || recipe?.notes}
                         </span>
                    )}
                </CardDescription>
             )}
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
            ) : recipe ? (
              <RecipeDisplay
                recipe={recipe}
                refinedRecipe={refinedRecipe}
                alternativeTypes={alternativeTypes} // Pass alternative types
                onRefine={handleRefineRecipe}
                onSelectAlternative={handleGenerateAlternative} // Pass alternative selection handler
                isRefining={isRefining}
                isGenerating={isGenerating} // Pass generating state for disabling alternative buttons
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
                    priority
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
