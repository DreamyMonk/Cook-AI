
'use server';
/**
 * @fileOverview Provides detailed explanations for recipe instructions using an AI model.
 *
 * - explainInstructions - Function to get a detailed explanation for recipe steps.
 * - ExplainInstructionsInput - Input type for the explainInstructions function.
 * - ExplainInstructionsOutput - Return type for the explainInstructions function.
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';

// Input Schema
const ExplainInstructionsInputSchema = z.object({
  recipeName: z.string().describe('The name of the recipe.'),
  originalInstructions: z.string().describe('The original step-by-step instructions that need explanation.'),
  ingredientsList: z.string().describe('A formatted list of ingredients available for the recipe (including main and additional).'),
});
export type ExplainInstructionsInput = z.infer<typeof ExplainInstructionsInputSchema>;

// Output Schema
const ExplainInstructionsOutputSchema = z.object({
  detailedExplanation: z.string().describe('A detailed, step-by-step explanation of the original instructions, including tips, techniques, and reasoning, formatted clearly (e.g., using markdown lists or numbered steps).'),
});
export type ExplainInstructionsOutput = z.infer<typeof ExplainInstructionsOutputSchema>;

// Exported function calling the flow
export async function explainInstructions(input: ExplainInstructionsInput): Promise<ExplainInstructionsOutput> {
  if (!input.originalInstructions || input.originalInstructions.trim().length === 0) {
      return { detailedExplanation: "No instructions provided to explain." };
  }
  return explainInstructionsFlow(input);
}

// Genkit Prompt Definition
const prompt = ai.definePrompt({
  name: 'explainInstructionsPrompt',
  input: { schema: ExplainInstructionsInputSchema },
  output: { schema: ExplainInstructionsOutputSchema },
  prompt: `You are a culinary instructor AI. Your task is to provide a detailed explanation for the given recipe instructions, assuming the user might be a beginner cook. Break down each step further, explain the "why" behind actions, offer tips, and clarify any potentially ambiguous terms.

Recipe Name: {{{recipeName}}}

Available Ingredients (Reference):
{{{ingredientsList}}}

Original Instructions to Explain:
{{{originalInstructions}}}

Instructor's Task:
1.  **Review each step** from the 'Original Instructions'.
2.  For each step, provide a **more detailed breakdown**.
3.  **Explain the reasoning** (e.g., "Sauté onions until translucent to release their sweetness...").
4.  **Define any jargon** (e.g., "Dicing means cutting into small, even cubes...").
5.  **Offer practical tips** (e.g., "Don't overcrowd the pan when browning chicken...").
6.  **Maintain the original sequence** of steps but elaborate on each one.
7.  Format the 'detailedExplanation' clearly, perhaps using **numbered steps corresponding to the original**, with sub-points or paragraphs for details. Ensure it's easy to read and follow.
8.  Focus solely on explaining the provided instructions. Do not add new steps or change the recipe core.

Respond strictly with the 'detailedExplanation' field following the output schema.
`,
});

// Genkit Flow Definition
const explainInstructionsFlow = ai.defineFlow<
  typeof ExplainInstructionsInputSchema,
  typeof ExplainInstructionsOutputSchema
>(
  {
    name: 'explainInstructionsFlow',
    inputSchema: ExplainInstructionsInputSchema,
    outputSchema: ExplainInstructionsOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await prompt(input);
      if (output) {
        return output;
      } else {
        console.error("AI prompt (explainInstructions) returned null/undefined output for input:", input);
        // Return a structured error within the expected schema
        return {
          detailedExplanation: "Error: The AI instructor didn't provide an explanation. Please try again.",
        };
      }
    } catch (error) {
      console.error("Error in explainInstructionsFlow:", error);
      let errorMessage = "An unexpected error occurred while generating the explanation.";
      if (error instanceof Error) {
          if (error.message.includes('503') || error.message.includes('overloaded')) {
              errorMessage = "The AI instructor is currently busy! Please try again in a moment.";
          } else if (error.message.includes('API key')) {
              errorMessage = "There seems to be an issue with the AI configuration. Please contact support.";
          } else {
              errorMessage = `AI Error: ${error.message}.`;
          }
      }
      // Return a structured error within the expected schema
      return {
        detailedExplanation: `Error: ${errorMessage}`,
      };
    }
  }
);
