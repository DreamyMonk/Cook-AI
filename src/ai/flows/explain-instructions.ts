
'use server';
/**
 * @fileOverview Provides detailed explanations for recipe instructions using an AI model, supporting multiple languages.
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
  language: z
    .string()
    .optional()
    .describe('The desired language for the explanation output (e.g., "Spanish", "French", "German"). Default is English.'),
});
export type ExplainInstructionsInput = z.infer<typeof ExplainInstructionsInputSchema>;

// Output Schema
const ExplainInstructionsOutputSchema = z.object({
  detailedExplanation: z.string().describe('A detailed, step-by-step explanation of the original instructions, including tips, techniques, and reasoning, formatted clearly (e.g., using markdown lists or numbered steps).'),
}).describe('The detailed explanation, provided in the requested language (default English).');
export type ExplainInstructionsOutput = z.infer<typeof ExplainInstructionsOutputSchema>;

// Exported function calling the flow
export async function explainInstructions(input: ExplainInstructionsInput): Promise<ExplainInstructionsOutput> {
  const lang = input.language || "English";
  const messages = {
      "English": { noInstructions: "No instructions provided to explain." },
      "Spanish": { noInstructions: "No hay instrucciones proporcionadas para explicar." },
      "French": { noInstructions: "Aucune instruction fournie à expliquer." },
      "German": { noInstructions: "Keine Anweisungen zum Erklären bereitgestellt." },
       // Add more languages as needed
  };
  const msg = messages[lang as keyof typeof messages] || messages["English"];

  if (!input.originalInstructions || input.originalInstructions.trim().length === 0) {
      return { detailedExplanation: msg.noInstructions };
  }
  return explainInstructionsFlow(input);
}

// Genkit Prompt Definition
const prompt = ai.definePrompt({
  name: 'explainInstructionsPrompt',
  input: { schema: ExplainInstructionsInputSchema },
  output: { schema: ExplainInstructionsOutputSchema },
  prompt: `You are a culinary instructor AI. Your task is to provide a detailed explanation for the given recipe instructions, assuming the user might be a beginner cook.
{{#if language}}Generate the entire explanation in {{language}}.{{else}}Generate the entire explanation in English.{{/if}}

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

Respond strictly with the 'detailedExplanation' field following the output schema, in the requested language ({{#if language}}{{language}}{{else}}English{{/if}}).
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
    const lang = input.language || "English";
    const errorMessages = {
         "English": { errorDefault: "Error: The AI instructor didn't provide an explanation. Please try again.", unexpectedError: "An unexpected error occurred while generating the explanation.", busyError: "The AI instructor is currently busy! Please try again in a moment.", configError: "There seems to be an issue with the AI configuration. Please contact support.", aiError: "AI Error: {message}." },
         "Spanish": { errorDefault: "Error: El instructor de IA no proporcionó una explicación. Inténtalo de nuevo.", unexpectedError: "Ocurrió un error inesperado al generar la explicación.", busyError: "¡El instructor de IA está ocupado! Inténtalo de nuevo en un momento.", configError: "Parece haber un problema con la configuración de la IA. Contacta al soporte.", aiError: "Error de IA: {message}." },
         "French": { errorDefault: "Erreur : L'instructeur IA n'a pas fourni d'explication. Veuillez réessayer.", unexpectedError: "Une erreur inattendue s'est produite lors de la génération de l'explication.", busyError: "L'instructeur IA est actuellement occupé ! Veuillez réessayer dans un instant.", configError: "Il semble y avoir un problème avec la configuration de l'IA. Veuillez contacter le support.", aiError: "Erreur IA : {message}." },
         "German": { errorDefault: "Fehler: Der KI-Lehrer hat keine Erklärung geliefert. Bitte versuchen Sie es erneut.", unexpectedError: "Beim Generieren der Erklärung ist ein unerwarteter Fehler aufgetreten.", busyError: "Der KI-Lehrer ist gerade beschäftigt! Bitte versuchen Sie es in einem Moment erneut.", configError: "Es scheint ein Problem mit der KI-Konfiguration zu geben. Bitte kontaktieren Sie den Support.", aiError: "KI-Fehler: {message}." },
          // Add more languages as needed
    };
    const msg = errorMessages[lang as keyof typeof errorMessages] || errorMessages["English"];

    try {
      const { output } = await prompt(input);
      if (output) {
        return output;
      } else {
        console.error("AI prompt (explainInstructions) returned null/undefined output for input:", input);
        // Return a structured error within the expected schema
        return {
          detailedExplanation: msg.errorDefault,
        };
      }
    } catch (error) {
      console.error("Error in explainInstructionsFlow:", error);
      let errorMessage = msg.unexpectedError;
      if (error instanceof Error) {
          if (error.message.includes('503') || error.message.includes('overloaded')) {
              errorMessage = msg.busyError;
          } else if (error.message.includes('API key')) {
              errorMessage = msg.configError;
          } else {
              errorMessage = msg.aiError.replace('{message}', error.message);
          }
      }
      // Return a structured error within the expected schema
      return {
        detailedExplanation: `Error: ${errorMessage}`, // Keep "Error:" prefix in English for consistency? Or translate too?
      };
    }
  }
);
