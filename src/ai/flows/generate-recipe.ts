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
    .describe('A comma-separated list of ingredients confirmed to be AVAILABLE.'),
});
export type GenerateRecipeInput = z.infer<typeof GenerateRecipeInputSchema>;

// Keep the output schema simple for now. The prompt will guide the text content.
const GenerateRecipeOutputSchema = z.object({
  recipeName: z.string().describe('The name of the generated recipe. If no recipe is possible, state that here.'),
  ingredients: z.string().describe('A list of ingredients required for the recipe, clearly indicating which were provided and which are additional common staples (like oil, salt, pepper) assumed to be available. If no recipe is possible, explain why.'),
  instructions: z.string().describe('Step-by-step instructions for preparing the recipe. If no recipe is possible, this field might be empty or contain further explanation.'),
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
        .describe('A comma-separated list of AVAILABLE ingredients.'), // Updated description
    }),
  },
  output: {
    // Use the same output schema, relying on prompt instructions for content detail.
    schema: GenerateRecipeOutputSchema,
  },
  prompt: `You are a helpful chef assisting someone with limited ingredients. Your goal is to suggest a simple recipe that primarily uses ONLY the ingredients provided.

Available Ingredients (Confirmed): {{{ingredients}}}

Instructions for the Chef:
1.  Analyze the available ingredients provided: {{{ingredients}}}.
2.  Generate a recipe name, a list of ingredients needed, and step-by-step instructions.
3.  **Crucially, the recipe MUST prioritize using ONLY the available ingredients provided.**
4.  You MAY assume common pantry staples like **cooking oil, salt, and pepper** are available, but you MUST explicitly list them in the ingredients section under a heading like "Assumed Staples".
5.  Do NOT include ingredients in the recipe that are not in the available list OR the assumed staples.
6.  If you cannot create a reasonable recipe using only the provided ingredients (plus assumed staples), clearly state this. In this case:
    *   Set 'recipeName' to something like "Recipe Not Possible with Provided Ingredients".
    *   Explain in the 'ingredients' field why a recipe isn't feasible (e.g., "Missing key components for a balanced meal").
    *   The 'instructions' field can be brief or empty.

Respond following the output schema structure.
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
    // Basic input validation (optional, Zod handles schema validation)
    if (!input.ingredients || input.ingredients.trim().length < 3) {
        // Return a structured error-like response matching the schema
        return {
            recipeName: "Input Error",
            ingredients: "No available ingredients provided or input too short.",
            instructions: "Please list the ingredients you have available and confirm them.",
        };
    }

    try {
        const {output} = await prompt(input);
        // Ensure output is not null, return it
        if (output) {
             return output;
        } else {
             // Handle cases where the prompt might return null/undefined unexpectedly
             console.error("AI prompt returned null output for input:", input);
             return {
                recipeName: "AI Error",
                ingredients: "Failed to get a response from the AI model.",
                instructions: "Please try again later.",
             };
        }
    } catch (error) {
        console.error("Error in generateRecipeFlow:", error);
        // Return a structured error response matching the schema
         let errorMessage = "An unexpected error occurred while generating the recipe.";
         if (error instanceof Error) {
            // Provide more specific error message if available
            errorMessage = `AI Error: ${error.message}`;
         }
         return {
            recipeName: "Generation Failed",
            ingredients: errorMessage,
            instructions: "Please check the input or try again later.",
         };
    }
  }
);
