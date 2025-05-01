'use client';

import React, { useState, useTransition } from 'react';
import { IngredientForm, type IngredientFormData } from '@/components/ingredient-form';
import { RecipeDisplay } from '@/components/recipe-display';
import { generateRecipe, type GenerateRecipeOutput } from '@/ai/flows/generate-recipe';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, UtensilsCrossed, TriangleAlert } from 'lucide-react';
import Image from 'next/image';

export default function Home() {
  const [recipe, setRecipe] = useState<GenerateRecipeOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, startTransition] = useTransition();

  const handleGenerateRecipe = async (data: IngredientFormData) => {
    setError(null);
    setRecipe(null); // Clear previous recipe

    startTransition(async () => {
      try {
        const result = await generateRecipe({ ingredients: data.ingredients });
        if (result) {
           setRecipe(result);
        } else {
          setError('Could not generate a recipe. The AI might be unavailable or the input was invalid.');
        }
      } catch (e) {
        console.error('Error generating recipe:', e);
        setError('An unexpected error occurred while generating the recipe. Please try again later.');
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
        <Card className="shadow-lg rounded-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-primary">Your Ingredients</CardTitle>
            <CardDescription>
              List the ingredients you have available, separated by commas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <IngredientForm onSubmit={handleGenerateRecipe} isGenerating={isGenerating} />
          </CardContent>
        </Card>

        <Card className="shadow-lg rounded-lg flex flex-col min-h-[300px]">
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
                <p>Enter your ingredients and click "Generate Recipe" to get started!</p>
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
