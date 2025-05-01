
'use server';
/**
 * @fileOverview Refines a recipe based on user feedback about unavailable additional ingredients.
 *
 * - refineRecipe - A function that handles the recipe refinement process.
 * - RefineRecipeInput - The input type for the refineRecipe function.
 * - RefineRecipeOutput - The return type for the refineRecipe function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

// Define schema internally, but don't export it
const RefineRecipeInputSchema = z.object({
  originalRecipeName: z.string().describe('The name of the original recipe.'),
  providedIngredients: z.array(z.string()).describe('The main ingredients the user initially provided.'),
  originalAdditionalIngredients: z.array(z.string()).describe('The full list of additional ingredients originally suggested.'),
  unavailableAdditionalIngredients: z.array(z.string()).describe('The subset of additional ingredients the user marked as unavailable.'),
  originalInstructions: z.string().describe('The original recipe instructions.'),
});
export type RefineRecipeInput = z.infer<typeof RefineRecipeInputSchema>;

// Define schema internally, but don't export it
const RefineRecipeOutputSchema = z.object({
  refinedRecipeName: z.string().describe('The name of the refined recipe (can be the same or slightly modified).'),
  refinedIngredients: z.string().describe('A formatted list of ingredients required for the *refined* recipe.'),
  refinedInstructions: z.string().describe('The updated step-by-step instructions for the refined recipe.'),
  feasibilityNotes: z.string().describe('Notes on the feasibility of the refinement, suggested substitutions for unavailable items, or confirmation that the recipe works without them. If refinement is impossible, explain why.'),
});
export type RefineRecipeOutput = z.infer<typeof RefineRecipeOutputSchema>;

export async function refineRecipe(input: RefineRecipeInput): Promise<RefineRecipeOutput> {
  // Add basic validation if needed, though Zod handles schema
  if (input.unavailableAdditionalIngredients.length === 0 && input.originalAdditionalIngredients.length > 0) {
    // If nothing is marked unavailable, maybe just return the original slightly formatted?
    // Or just let the AI confirm it's fine. Let's let the AI handle it for consistency.
  }
  return refineRecipeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'refineRecipePrompt',
  input: { schema: RefineRecipeInputSchema },
  output: { schema: RefineRecipeOutputSchema },
  prompt: `You are a helpful recipe assistant. A user was given a recipe based on ingredients they have, but they've indicated some of the *additional* suggested ingredients are unavailable. Your task is to refine the recipe or provide guidance.

Original Recipe Name: {{{originalRecipeName}}}
User's Main Ingredients: {{#each providedIngredients}}- {{{this}}}{{/each}}
Originally Suggested Additional Ingredients: {{#each originalAdditionalIngredients}}- {{{this}}}{{/each}}
User-Marked UNAVAILABLE Additional Ingredients: {{#if unavailableAdditionalIngredients}}{{#each unavailableAdditionalIngredients}}- {{{this}}}{{/each}}{{else}}None{{/if}}
Original Instructions:
{{{originalInstructions}}}

Instructions for Refinement:
1.  Analyze the unavailable ingredients.
2.  Determine if the recipe can still be made without them, or with simple substitutions using common staples (oil, salt, pepper, water, maybe flour/sugar if appropriate context).
3.  **If Feasible:**
    *   Update the instructions ('refinedInstructions') to reflect the changes or omissions.
    *   Create a new ingredient list ('refinedIngredients') reflecting ONLY the required items for the modified recipe. Clearly separate the user's main ingredients and the *now-needed* additional ones. Use markdown or newlines for formatting.
    *   Keep the recipe name ('refinedRecipeName') similar or the same.
    *   Add notes ('feasibilityNotes') explaining the changes (e.g., "Recipe adjusted to omit [unavailable ingredient]. Taste might be slightly different.", "Substituted [unavailable] with [staple].").
4.  **If Not Feasible (or significantly compromised):**
    *   Set 'refinedRecipeName' to indicate failure (e.g., "Refinement Difficult: {{{originalRecipeName}}}").
    *   Explain clearly in 'feasibilityNotes' why it's not possible or highly discouraged (e.g., "[Unavailable ingredient] is crucial for this dish.").
    *   Keep 'refinedIngredients' and 'refinedInstructions' brief, perhaps suggesting alternative simple uses for the user's main ingredients.
5.  **If NO additional ingredients were marked unavailable:**
    *   Simply confirm this in 'feasibilityNotes' (e.g., "Great! All suggested ingredients are available. Proceed with the original recipe.").
    *   Return the original recipe details formatted for the 'refined*' fields. The 'refinedIngredients' list should contain both provided and additional ingredients, clearly marked. Use markdown or newlines for formatting.

Respond strictly following the output schema structure. Ensure 'refinedIngredients' and 'refinedInstructions' are formatted clearly for display (e.g., using markdown lists or line breaks).
`,
});


const refineRecipeFlow = ai.defineFlow<
  typeof RefineRecipeInputSchema,
  typeof RefineRecipeOutputSchema
>(
  {
    name: 'refineRecipeFlow',
    inputSchema: RefineRecipeInputSchema,
    outputSchema: RefineRecipeOutputSchema,
  },
  async input => {
     try {
        const {output} = await prompt(input);
        if (output) {
            return output;
        } else {
            console.error("AI prompt (refineRecipe) returned null output for input:", input);
             return {
                refinedRecipeName: "AI Error",
                refinedIngredients: "Failed to get a response from the AI model.",
                refinedInstructions: "Please try again later.",
                feasibilityNotes: "AI model did not return valid output during refinement."
             };
        }
     } catch (error) {
        console.error("Error in refineRecipeFlow:", error);
        let errorMessage = "An unexpected error occurred while refining the recipe.";
         if (error instanceof Error) {
            errorMessage = `AI Error: ${error.message}`;
             if (error.message.includes('503') || error.message.includes('overloaded')) {
                 errorMessage = "The AI chef is busy refining recipes! Please try again in a moment.";
            }
         }
          return {
            refinedRecipeName: "Refinement Failed",
            refinedIngredients: errorMessage,
            refinedInstructions: "Please check the input or try again later.",
            feasibilityNotes: "Recipe refinement failed due to an error."
         };
     }
  }
);

