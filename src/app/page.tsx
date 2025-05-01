'use client';

import React, { useState, useTransition } from 'react';
import { IngredientForm } from '@/components/ingredient-form'; // Removed IngredientFormData type import
import { RecipeDisplay } from '@/components/recipe-display';
import { generateRecipe, type GenerateRecipeOutput } from '@/ai/flows/generate-recipe';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, UtensilsCrossed, TriangleAlert } from 'lucide-react';
import Image from 'next/image';

// Define the type for the structured ingredient data
interface IngredientItem {
  id: string;
  name: string;
  available: boolean;
}


export default function Home() {
  const [recipe, setRecipe] = useState<GenerateRecipeOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, startTransition] = useTransition();

  // Updated handler to accept the structured ingredient list
  const handleGenerateRecipe = async (ingredientsList: IngredientItem[]) => {
    setError(null);
    setRecipe(null); // Clear previous recipe

    // Filter only available ingredients and format them as a comma-separated string
    const availableIngredientsString = ingredientsList
      .filter(item => item.available)
      .map(item => item.name)
      .join(', ');

    // Optional: Add unavailable ingredients for context (adjust prompt if needed)
    // const unavailableIngredientsString = ingredientsList
    //   .filter(item => !item.available)
    //   .map(item => item.name)
    //   .join(', ');
    // Input for the flow could be { availableIngredients: ..., unavailableIngredients: ... }

    // Basic check if any available ingredients are left
     if (!availableIngredientsString) {
       setError("No available ingredients selected. Please check some ingredients as available.");
       return;
     }


    startTransition(async () => {
      try {
         // Pass the formatted string of available ingredients to the flow
        const result = await generateRecipe({ ingredients: availableIngredientsString });
        if (result) {
           setRecipe(result);
        } else {
          setError('Could not generate a recipe. The AI might be unavailable or the input was invalid.');
        }
      } catch (e) {
        console.error('Error generating recipe:', e);
        if (e instanceof Error) {
          // Display more specific error from AI if available
          setError(`An unexpected error occurred: ${e.message}. Please try again later.`);
        } else {
          setError('An unexpected error occurred while generating the recipe. Please try again later.');
        }
      }
    });
  };

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
              Enter ingredients, then confirm availability below.
            </CardDescription>
          </CardHeader>
          <CardContent>
             {/* Pass the updated handler */}
            <IngredientForm onSubmit={handleGenerateRecipe} isGenerating={isGenerating} />
          </CardContent>
        </Card>

        {/* Recipe Display Card */}
        <Card className="shadow-lg rounded-lg flex flex-col min-h-[300px] justify-between">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-primary">Suggested Recipe</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow flex items-center justify-center">
            {isGenerating ? (
              <div className="flex flex-col items-center text-muted-foreground">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p>Generating your delicious recipe...</p>
              </div>
            ) : error ? (
               <Alert variant="destructive" className="w-full">
                  <TriangleAlert className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
               </Alert>
            ) : recipe ? (
              <RecipeDisplay recipe={recipe} />
            ) : (
              <div className="text-center text-muted-foreground space-y-4">
                 <Image
                    src="https://picsum.photos/seed/recipebook/300/200"
                    alt="Empty plate waiting for a recipe"
                    width={300}
                    height={200}
                    className="rounded-lg mx-auto"
                    data-ai-hint="recipe book cooking"
                  />
                <p>Enter ingredients, confirm availability, and click "Generate Recipe"!</p>
              </div>
            )}
          </CardContent>
           {/* Optional: Footer within the recipe card if needed */}
        </Card>
      </div>

      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} FridgeChef. Powered by AI.</p>
      </footer>
    </main>
  );
}
