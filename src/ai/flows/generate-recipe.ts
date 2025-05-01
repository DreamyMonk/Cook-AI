
'use server';

/**
 * @fileOverview An AI agent to generate recipes based on available ingredients.
 *
 * - generateRecipe - A function that handles the recipe generation process.
 * - GenerateRecipeInput - The input type for the generateRecipe function.
 * - GenerateRecipeOutput - The return type for the generateRecipe function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

// Input schema expects only the available ingredients as a comma-separated string.
const GenerateRecipeInputSchema = z.object({
  ingredients: z
    .string()
    .describe('A comma-separated list of ingredients confirmed to be AVAILABLE by the user.'),
});
export type GenerateRecipeInput = z.infer<typeof GenerateRecipeInputSchema>;

// Updated output schema with structured ingredients
const GenerateRecipeOutputSchema = z.object({
  recipeName: z.string().describe('The name of the generated recipe. If no recipe is possible, state that here.'),
  providedIngredients: z.array(z.string()).describe('List of the main ingredients provided by the user that are used in the recipe.'),
  additionalIngredients: z.array(z.string()).describe('List of additional ingredients needed for the recipe, including common staples (like oil, salt, pepper) and any other suggested items. If no recipe is possible, this list might be empty or contain explanation.'),
  instructions: z.string().describe('Step-by-step instructions for preparing the recipe. If no recipe is possible, this field might be empty or contain further explanation.'),
  notes: z.string().optional().describe('Optional brief notes about the recipe, substitutions, or why it might be simple/complex given the ingredients.')
});
export type GenerateRecipeOutput = z.infer<typeof GenerateRecipeOutputSchema>;

export async function generateRecipe(input: GenerateRecipeInput): Promise<GenerateRecipeOutput> {
  return generateRecipeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateRecipePrompt',
  input: {
    schema: z.object({
      ingredients: z
        .string()
        .describe('A comma-separated list of AVAILABLE ingredients confirmed by the user.'),
    }),
  },
  output: {
    // Use the updated output schema
    schema: GenerateRecipeOutputSchema,
  },
  prompt: `You are a helpful chef assisting someone with the ingredients they have on hand. Your goal is to suggest a simple recipe that primarily uses the main ingredients provided.

Main Available Ingredients (Confirmed by User): {{{ingredients}}}

Instructions for the Chef:
1.  Analyze the main available ingredients provided: {{{ingredients}}}.
2.  Generate a recipe name, structured lists for provided and additional ingredients, and step-by-step instructions.
3.  **Crucially, the recipe should FEATURE the main available ingredients.** Treat them as the core components. List these used main ingredients accurately under 'providedIngredients'.
4.  You MAY incorporate other common ingredients to make a complete dish. List these clearly under 'additionalIngredients'.
5.  You MUST assume common pantry staples like **cooking oil, salt, and pepper** are available, and list them under 'additionalIngredients'.
6.  Try to be creative but realistic. Keep the recipe relatively simple if the ingredients are basic.
7.  If a reasonable recipe cannot be created even with some additions, state this clearly. In this case:
    *   Set 'recipeName' to something like "Recipe Idea Blocked".
    *   Explain in the 'notes' field why a recipe isn't feasible (e.g., "Missing key components for a balanced meal, even with staples").
    *   Keep 'providedIngredients' and 'additionalIngredients' arrays empty.
    *   The 'instructions' field can be brief or suggest simple ways to use individual ingredients.
8. Add brief optional 'notes' if relevant (e.g., "This is a very simple recipe due to limited ingredients", "Feel free to add X if you have it").

Respond strictly following the output schema structure. Ensure 'providedIngredients' and 'additionalIngredients' are arrays of strings.
`,
});


const generateRecipeFlow = ai.defineFlow<
  typeof GenerateRecipeInputSchema,
  typeof GenerateRecipeOutputSchema
>(
  {
    name: 'generateRecipeFlow',
    inputSchema: GenerateRecipeInputSchema,
    outputSchema: GenerateRecipeOutputSchema,
  },
  async input => {
    // Basic input validation
    if (!input.ingredients || input.ingredients.trim().length === 0) {
        return {
            recipeName: "Input Error",
            providedIngredients: [],
            additionalIngredients: ["No available ingredients provided."],
            instructions: "Please list the ingredients you have available and confirm them.",
            notes: "Input error occurred."
        };
    }

    try {
        const {output} = await prompt(input);
        // Ensure output is not null, return it
        if (output) {
             // Ensure arrays are present, default to empty if missing (shouldn't happen with Zod)
             output.providedIngredients = output.providedIngredients ?? [];
             output.additionalIngredients = output.additionalIngredients ?? [];
             return output;
        } else {
             // Handle cases where the prompt might return null/undefined unexpectedly
             console.error("AI prompt returned null output for input:", input);
             return {
                recipeName: "AI Error",
                providedIngredients: [],
                additionalIngredients: ["Failed to get a response from the AI model."],
                instructions: "Please try again later.",
                notes: "AI model did not return valid output."
             };
        }
    } catch (error) {
        console.error("Error in generateRecipeFlow:", error);
         let errorMessage = "An unexpected error occurred while generating the recipe.";
         if (error instanceof Error) {
            errorMessage = `AI Error: ${error.message}`;
            if (error.message.includes('503 Service Unavailable') || error.message.includes('overloaded')) {
                 errorMessage = "The AI chef is currently very busy! Please try again in a moment.";
            }
         }
         return {
            recipeName: "Generation Failed",
            providedIngredients: [],
            additionalIngredients: [errorMessage],
            instructions: "Please check the input or try again later.",
            notes: "Recipe generation failed due to an error."
         };
    }
  }
);

