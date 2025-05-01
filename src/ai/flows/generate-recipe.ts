
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

// Input schema: Add optional preferred dish type
const GenerateRecipeInputSchema = z.object({
  ingredients: z
    .string()
    .describe('A comma-separated list of ingredients the user claims to have available.'),
  preferredDishType: z
    .string()
    .optional()
    .describe('If specified, guides the AI to generate a recipe matching this type (e.g., "soup", "stir-fry", "salad", "baked dish").'),
});
export type GenerateRecipeInput = z.infer<typeof GenerateRecipeInputSchema>;

// Output schema: Add optional alternative dish types
const GenerateRecipeOutputSchema = z.object({
  recipeName: z.string().describe('The name of the generated recipe. If no recipe is possible, state that clearly (e.g., "Unable to Create Recipe").'),
  providedIngredients: z.array(z.string()).describe('List of the main ingredients PROVIDED BY THE USER that are actually USED in the recipe. This list might be a subset of the user input.'),
  additionalIngredients: z.array(z.string()).describe('List of additional ingredients needed for the recipe. Include common staples (like oil, salt, pepper) AND commonly found vegetables (like onion, garlic, carrots, bell peppers, celery) or other fridge staples (like eggs, soy sauce) if they logically complement the main ingredients to create a more complete dish. If no recipe is possible, this list should be empty.'),
  instructions: z.string().describe('Step-by-step instructions for preparing the recipe. If no recipe is possible, this field should be empty or state "No instructions applicable."'),
  alternativeDishTypes: z.array(z.string()).optional().describe('If the main ingredients are versatile, lists other distinct types of dishes (e.g., "Soup", "Salad", "Stir-fry") that could potentially be made. Omit if only one clear type is suitable or if input is too limited.'),
  notes: z.string().optional().describe('Optional brief notes about the recipe, substitutions, or why it might be simple/complex. If no recipe is possible, explain why here (e.g., "Missing essential components for a cohesive dish.").')
});
export type GenerateRecipeOutput = z.infer<typeof GenerateRecipeOutputSchema>;

export async function generateRecipe(input: GenerateRecipeInput): Promise<GenerateRecipeOutput> {
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
    schema: GenerateRecipeInputSchema,
  },
  output: {
    schema: GenerateRecipeOutputSchema,
  },
  prompt: `You are an expert chef tasked with creating a sensible recipe using ingredients provided by a user.

User's Available Ingredients: {{{ingredients}}}
{{#if preferredDishType}}User's Preferred Dish Type: {{{preferredDishType}}}{{/if}}

Chef's Instructions:
1.  Analyze the user's ingredients: {{{ingredients}}}. These are the CORE components.
{{#if preferredDishType}}
2.  Prioritize creating a recipe that fits the '{{{preferredDishType}}}' category, using the core ingredients.
{{else}}
2.  Determine the most suitable type of dish based on the core ingredients (e.g., stir-fry, soup, baked dish, salad, pasta dish). Generate a suitable recipe name.
{{/if}}
3.  Determine which of the USER'S ingredients will actually be USED in the recipe. List ONLY these used ingredients under 'providedIngredients'.
4.  Identify any NECESSARY or highly complementary additional ingredients to make a sensible and more complete dish. Include:
    *   Basic Staples: Cooking oil, salt, pepper.
    *   Common Aromatics/Vegetables: **onion, garlic, carrots, celery, bell peppers**.
    *   Other Common Fridge Items: **eggs, milk, butter, soy sauce, basic canned tomatoes, potatoes**.
    *   Only include items that logically fit the main ingredients and the (preferred or determined) dish type.
    *   List these under 'additionalIngredients'.
5.  Write clear, step-by-step 'instructions'. The recipe MUST prominently feature the ingredients in 'providedIngredients'.
{{#unless preferredDishType}}
6.  **Assess Versatility:** After devising the primary recipe, consider if the CORE ingredients ({{{ingredients}}}) could *also* be used to make other *distinctly different types* of dishes (e.g., if you made a stir-fry, could they also make a soup or a casserole?).
    *   If yes, list these alternative dish types (e.g., "Soup", "Salad", "Baked Dish") in the 'alternativeDishTypes' array.
    *   Be realistic; only suggest plausible alternatives. Do not list minor variations of the main recipe. Omit this field if the ingredients are not versatile or too limited.
{{/unless}}
7.  **Failure Condition:** If a reasonable recipe cannot be created (even considering the preferred type, if any, or common additions):
    *   Set 'recipeName' to "Unable to Create Recipe".
    *   Keep 'providedIngredients', 'additionalIngredients', and 'alternativeDishTypes' as empty arrays ([] or undefined).
    *   Set 'instructions' to "No instructions applicable.".
    *   Explain *why* in the 'notes' field.
8. Add brief, optional 'notes' for suggestions or explanations.

Respond strictly following the output schema structure. Ensure 'providedIngredients', 'additionalIngredients', and 'alternativeDishTypes' (if present) are ALWAYS arrays of strings, even if empty.
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
             output.alternativeDishTypes = output.alternativeDishTypes ?? undefined; // Keep as undefined if not generated
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
            if (error.message.includes('503') || error.message.includes('overloaded')) {
                 errorMessage = "The AI chef is currently very busy with requests! Please try again in a moment.";
                 errorTitle = "AI Busy";
            } else if (error.message.includes('API key')) {
                 errorMessage = "There seems to be an issue with the AI configuration. Please contact support.";
                 errorTitle = "Configuration Error";
            } else {
                 errorMessage = `AI Error: ${error.message}. Please check your input or try again later.`;
                 errorTitle = "AI Error";
            }
         }
         return {
            recipeName: errorTitle,
            providedIngredients: [],
            additionalIngredients: [],
            instructions: "No instructions available due to error.",
            notes: errorMessage
         };
    }
  }
);
