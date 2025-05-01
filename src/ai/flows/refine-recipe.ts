
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

// Schema for the input to the refinement flow
const RefineRecipeInputSchema = z.object({
  originalRecipeName: z.string().describe('The name of the original recipe generated.'),
  providedIngredients: z.array(z.string()).describe('The list of MAIN ingredients from the original recipe (the ones the AI confirmed it used from user input).'),
  originalAdditionalIngredients: z.array(z.string()).describe('The full list of ADDITIONAL ingredients originally suggested by the AI.'),
  unavailableAdditionalIngredients: z.array(z.string()).describe('The subset of ADDITIONAL ingredients the user marked as unavailable.'),
  originalInstructions: z.string().describe('The original step-by-step recipe instructions.'),
});
export type RefineRecipeInput = z.infer<typeof RefineRecipeInputSchema>;

// Schema for the output of the refinement flow
const RefineRecipeOutputSchema = z.object({
  refinedRecipeName: z.string().describe('The name of the refined recipe (can be the same or slightly modified, e.g., "Chicken Stir-Fry (No Broccoli)"). If refinement is impossible, indicate failure clearly (e.g., "Refinement Failed: Missing Key Ingredient").'),
  refinedIngredients: z.string().describe('A CLEARLY FORMATTED string listing the ingredients required for the *refined* recipe. Use Markdown lists or similar structure to differentiate between main and newly required additional ingredients. Example: "**Main:**\\n- Chicken\\n- Rice\\n**Additional:**\\n- Soy Sauce\\n- Oil\\n- Salt, Pepper"'),
  refinedInstructions: z.string().describe('The updated step-by-step instructions for the refined recipe. If refinement is impossible, state "No instructions applicable."'),
  feasibilityNotes: z.string().describe('Notes explaining the changes, substitutions, impact of omissions, or confirming the original is fine. If refinement is impossible, EXPLAIN CLEARLY why (e.g., "Cannot make sauce without soy sauce.").'),
});
export type RefineRecipeOutput = z.infer<typeof RefineRecipeOutputSchema>;


// Exported function that wraps the Genkit flow
export async function refineRecipe(input: RefineRecipeInput): Promise<RefineRecipeOutput> {
  // Basic validation (though Zod handles schema)
  if (!input.originalRecipeName || !input.originalInstructions) {
     return {
        refinedRecipeName: "Refinement Failed: Input Missing",
        refinedIngredients: "Missing original recipe details.",
        refinedInstructions: "No instructions applicable.",
        feasibilityNotes: "Cannot refine recipe without original name and instructions.",
     }
  }
  return refineRecipeFlow(input);
}

// Genkit Prompt definition
const prompt = ai.definePrompt({
  name: 'refineRecipePrompt',
  input: { schema: RefineRecipeInputSchema },
  output: { schema: RefineRecipeOutputSchema },
  prompt: `You are a helpful recipe assistant. A user received a recipe ('{{{originalRecipeName}}}') but indicated some *additional* ingredients are unavailable. Your task is to adapt the recipe or explain why it's not possible.

Original Recipe Details:
- Main Ingredients Used (from user's input): {{#each providedIngredients}}- {{{this}}}{{/each}}
- Originally Suggested Additional Ingredients: {{#each originalAdditionalIngredients}}- {{{this}}}{{/each}}
- Original Instructions: {{{originalInstructions}}}

User Feedback:
- UNAVAILABLE Additional Ingredients: {{#if unavailableAdditionalIngredients}}{{#each unavailableAdditionalIngredients}}- {{{this}}}{{/each}}{{else}}None marked as unavailable.{{/if}}

Refinement Instructions:
1.  **Analyze:** Identify the 'unavailableAdditionalIngredients'.
2.  **Assess Feasibility:** Can the recipe work without them? Can simple substitutions (using common staples like oil, salt, pepper, water, maybe basic flour/sugar if contextually appropriate) be made?
3.  **If Feasible (or no changes needed):**
    *   Modify 'originalInstructions' to remove or substitute unavailable items, creating 'refinedInstructions'.
    *   Generate 'refinedIngredients': a **clearly formatted string** (use Markdown lists like "**Main:**\\n- Item 1\\n**Additional:**\\n- Item 2") listing ONLY the ingredients *now* required. Include the original 'providedIngredients' and the *remaining* 'additionalIngredients'.
    *   Keep 'refinedRecipeName' similar or add a note (e.g., "{{{originalRecipeName}}} (No Onion)").
    *   Write 'feasibilityNotes' explaining the changes (e.g., "Removed onion, flavour profile slightly changed.", "Substituted X for Y.") or confirming sufficiency ("All needed items available!").
4.  **If Not Feasible:**
    *   Set 'refinedRecipeName' to indicate failure (e.g., "Refinement Failed: {{{originalRecipeName}}} - Missing Crucial Item").
    *   Explain clearly in 'feasibilityNotes' *why* it fails (e.g., "[Unavailable item] is essential for the sauce/structure.").
    *   Set 'refinedIngredients' to a message like "Refinement not possible."
    *   Set 'refinedInstructions' to "No instructions applicable."
5.  **If NO items were marked unavailable:**
    *   Set 'refinedRecipeName' to "{{{originalRecipeName}}} (Confirmed)".
    *   Format the complete original ingredient list (provided + additional) clearly in 'refinedIngredients' using Markdown lists.
    *   Copy 'originalInstructions' to 'refinedInstructions'.
    *   Set 'feasibilityNotes' to "Great! All suggested ingredients are available. Proceed with the original recipe.".

**Output Format:** Respond strictly following the output schema: {refinedRecipeName: string, refinedIngredients: string (formatted markdown), refinedInstructions: string, feasibilityNotes: string}.
`,
});

// Genkit Flow definition
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
            // Ensure required fields are present (Zod should handle this)
             output.refinedIngredients = output.refinedIngredients || "Ingredient list unavailable.";
             output.refinedInstructions = output.refinedInstructions || "Instructions unavailable.";
             output.feasibilityNotes = output.feasibilityNotes || "No specific notes provided.";
            return output;
        } else {
            console.error("AI prompt (refineRecipe) returned null/undefined output for input:", input);
             return {
                refinedRecipeName: "AI Error: No Response",
                refinedIngredients: "Failed to get refined ingredients from the AI model.",
                refinedInstructions: "Failed to get refined instructions.",
                feasibilityNotes: "AI model did not return valid output during refinement. Please try again."
             };
        }
     } catch (error) {
        console.error("Error in refineRecipeFlow:", error);
        let errorMessage = "An unexpected error occurred while refining the recipe.";
        let errorTitle = "Refinement Failed";

         if (error instanceof Error) {
             if (error.message.includes('503') || error.message.includes('overloaded')) {
                 errorMessage = "The AI chef is busy refining recipes! Please try again in a moment.";
                 errorTitle = "AI Busy";
             } else if (error.message.includes('API key')) {
                  errorMessage = "There seems to be an issue with the AI configuration. Please contact support.";
                  errorTitle = "Configuration Error";
             } else {
                 errorMessage = `AI Error: ${error.message}`;
                 errorTitle = "AI Error";
            }
         }
          return {
            refinedRecipeName: errorTitle,
            refinedIngredients: "Ingredient details unavailable due to error.",
            refinedInstructions: "Instructions unavailable due to error.",
            feasibilityNotes: errorMessage // Provide detailed error in notes
         };
     }
  }
);
