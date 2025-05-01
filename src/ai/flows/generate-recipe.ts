
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
    .describe('A comma-separated list of ingredients the user claims to have available.'),
});
export type GenerateRecipeInput = z.infer<typeof GenerateRecipeInputSchema>;

// Output schema with structured ingredients and clear naming
const GenerateRecipeOutputSchema = z.object({
  recipeName: z.string().describe('The name of the generated recipe. If no recipe is possible, state that clearly (e.g., "Unable to Create Recipe").'),
  providedIngredients: z.array(z.string()).describe('List of the main ingredients PROVIDED BY THE USER that are actually USED in the recipe. This list might be a subset of the user input.'),
  additionalIngredients: z.array(z.string()).describe('List of additional ingredients needed for the recipe. Include common staples (like oil, salt, pepper) AND commonly found vegetables (like onion, garlic, carrots, bell peppers, celery) or other fridge staples (like eggs, soy sauce) if they logically complement the main ingredients to create a more complete dish. If no recipe is possible, this list should be empty.'),
  instructions: z.string().describe('Step-by-step instructions for preparing the recipe. If no recipe is possible, this field should be empty or state "No instructions applicable."'),
  notes: z.string().optional().describe('Optional brief notes about the recipe, substitutions, or why it might be simple/complex. If no recipe is possible, explain why here (e.g., "Missing essential components for a cohesive dish.").')
});
export type GenerateRecipeOutput = z.infer<typeof GenerateRecipeOutputSchema>;

export async function generateRecipe(input: GenerateRecipeInput): Promise<GenerateRecipeOutput> {
  // Input validation is now primarily handled by the flow and prompt logic
  if (!input.ingredients || input.ingredients.trim().length === 0) {
      return {
          recipeName: "Input Error: No Ingredients",
          providedIngredients: [],
          additionalIngredients: [],
          instructions: "No instructions applicable.",
          notes: "Please list the ingredients you have available."
      };
  }
  return generateRecipeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateRecipePrompt',
  input: {
    schema: GenerateRecipeInputSchema, // Use the input schema defined above
  },
  output: {
    // Use the updated output schema
    schema: GenerateRecipeOutputSchema,
  },
  prompt: `You are an expert chef tasked with creating a sensible recipe using ingredients provided by a user. Your goal is to make the best possible dish focusing *primarily* on the ingredients the user listed, but suggesting common additions to make it more complete.

User's Available Ingredients: {{{ingredients}}}

Chef's Instructions:
1.  Analyze the user's ingredients: {{{ingredients}}}. These are the CORE components.
2.  Generate a suitable recipe name based on the core ingredients.
3.  Determine which of the USER'S ingredients will actually be USED in the recipe. List ONLY these used ingredients under 'providedIngredients'.
4.  Identify any NECESSARY or highly complementary additional ingredients to make a sensible and more complete dish. This should include:
    *   **Basic Staples:** Cooking oil, salt, pepper are almost always needed.
    *   **Common Aromatics/Vegetables:** Include items like **onion, garlic, carrots, celery, bell peppers** if they logically fit the main ingredients (e.g., onion/garlic for most savory dishes).
    *   **Other Common Fridge Items:** Consider things like **eggs, milk, butter, soy sauce, basic canned tomatoes** if they strongly complement the core ingredients and are frequently available.
    *   **Goal:** Aim for a reasonable, well-rounded dish, but don't go overboard. Remember the user can uncheck items they don't have later.
    *   **List these under 'additionalIngredients'.**
5.  Write clear, step-by-step 'instructions'.
6.  **Crucially, the recipe MUST prominently feature the user's ingredients listed in 'providedIngredients'.** Do not suggest complex recipes if the core ingredients are very basic.
7.  **If a reasonable recipe cannot be created** (e.g., only 'salt' provided, or ingredients are completely incompatible even with common additions), then:
    *   Set 'recipeName' to "Unable to Create Recipe".
    *   Keep 'providedIngredients' and 'additionalIngredients' as empty arrays ([]).
    *   Set 'instructions' to "No instructions applicable.".
    *   Explain *why* a recipe isn't feasible in the 'notes' field (e.g., "The provided ingredients lack a core component for a meal, even with common additions.").
8. Add brief, optional 'notes' for suggestions (e.g., "Add chili flakes for heat if available", "Simple dish due to limited items") or explanations.

Respond strictly following the output schema structure: {recipeName: string, providedIngredients: string[], additionalIngredients: string[], instructions: string, notes?: string}. Ensure 'providedIngredients' and 'additionalIngredients' are ALWAYS arrays of strings, even if empty.
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
    // Basic check already done in the wrapper, but belt-and-suspenders
    if (!input.ingredients || input.ingredients.trim().length === 0) {
        return {
            recipeName: "Input Error: No Ingredients",
            providedIngredients: [],
            additionalIngredients: [],
            instructions: "No instructions applicable.",
            notes: "No ingredients were provided to the recipe generator."
        };
    }

    try {
        const {output} = await prompt(input);
        // Ensure output is not null and conforms to the schema (Zod handles structure)
        if (output) {
             // Ensure arrays are always present, default to empty if somehow missing (Zod should prevent this)
             output.providedIngredients = output.providedIngredients ?? [];
             output.additionalIngredients = output.additionalIngredients ?? [];
             output.instructions = output.instructions || "No instructions generated."; // Provide default if empty
             return output;
        } else {
             // Handle unexpected null/undefined output from the prompt
             console.error("AI prompt returned null/undefined output for input:", input);
             return {
                recipeName: "AI Error: No Response",
                providedIngredients: [],
                additionalIngredients: [],
                instructions: "Failed to get recipe instructions.",
                notes: "The AI model did not return a valid recipe response. Please try again."
             };
        }
    } catch (error) {
        console.error("Error in generateRecipeFlow:", error);
         let errorMessage = "An unexpected error occurred while generating the recipe.";
         let errorTitle = "Generation Failed";

         if (error instanceof Error) {
            // Specific error handling
            if (error.message.includes('503') || error.message.includes('overloaded')) {
                 errorMessage = "The AI chef is currently very busy with requests! Please try again in a moment.";
                 errorTitle = "AI Busy";
            } else if (error.message.includes('API key')) {
                 errorMessage = "There seems to be an issue with the AI configuration. Please contact support.";
                 errorTitle = "Configuration Error";
            } else {
                 // General AI error message
                 errorMessage = `AI Error: ${error.message}. Please check your input or try again later.`;
                 errorTitle = "AI Error";
            }
         }
         // Return a structured error response
         return {
            recipeName: errorTitle,
            providedIngredients: [],
            additionalIngredients: [],
            instructions: "No instructions available due to error.",
            notes: errorMessage // Provide the detailed error message in notes
         };
    }
  }
);

