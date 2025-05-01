// Recipe instruction improvement flow.
'use server';
/**
 * @fileOverview Improves recipe instructions for clarity and ease of understanding.
 *
 * - improveRecipeInstruction - A function that enhances recipe instructions.
 * - ImproveRecipeInstructionInput - The input type for the improveRecipeInstruction function.
 * - ImproveRecipeInstructionOutput - The return type for the improveRecipeInstruction function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const ImproveRecipeInstructionInputSchema = z.object({
  recipeName: z.string().describe('The name of the recipe.'),
  originalInstructions: z.string().describe('The original recipe instructions.'),
});
export type ImproveRecipeInstructionInput = z.infer<
  typeof ImproveRecipeInstructionInputSchema
>;

const ImproveRecipeInstructionOutputSchema = z.object({
  improvedInstructions: z.string().describe('The improved recipe instructions.'),
});
export type ImproveRecipeInstructionOutput = z.infer<
  typeof ImproveRecipeInstructionOutputSchema
>;

export async function improveRecipeInstruction(
  input: ImproveRecipeInstructionInput
): Promise<ImproveRecipeInstructionOutput> {
  return improveRecipeInstructionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'improveRecipeInstructionPrompt',
  input: {
    schema: z.object({
      recipeName: z.string().describe('The name of the recipe.'),
      originalInstructions: z.string().describe('The original recipe instructions.'),
    }),
  },
  output: {
    schema: z.object({
      improvedInstructions: z.string().describe('The improved recipe instructions.'),
    }),
  },
  prompt: `You are an expert recipe instruction writer. Your goal is to make recipe instructions as clear and easy to follow as possible.

Recipe Name: {{{recipeName}}}

Original Instructions: {{{originalInstructions}}}

Improved Instructions:`,
});

const improveRecipeInstructionFlow = ai.defineFlow<
  typeof ImproveRecipeInstructionInputSchema,
  typeof ImproveRecipeInstructionOutputSchema
>(
  {
    name: 'improveRecipeInstructionFlow',
    inputSchema: ImproveRecipeInstructionInputSchema,
    outputSchema: ImproveRecipeInstructionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
