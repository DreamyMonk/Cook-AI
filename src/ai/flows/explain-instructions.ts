
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
    .describe('The desired language for the explanation output (e.g., "Spanish", "French", "German", "Hindi", "Bengali"). Default is English.'),
});
export type ExplainInstructionsInput = z.infer<typeof ExplainInstructionsInputSchema>;

// Output Schema
const ExplainInstructionsOutputSchema = z.object({
  detailedExplanation: z.string().describe('A detailed, step-by-step explanation of the original instructions, including tips, techniques, and reasoning, formatted clearly (e.g., using markdown lists or numbered steps).'),
}).describe('The detailed explanation, provided in the requested language (default English).');
export type ExplainInstructionsOutput = z.infer<typeof ExplainInstructionsOutputSchema>;

// Exported function calling the flow
export async function explainInstructions(input: ExplainInstructionsInput): Promise<ExplainInstructionsOutput> {
  const lang = input.language || "English"; // Use language name
  // Define messages based on language name
  const messages: { [key: string]: { noInstructions: string } } = {
      "English": { noInstructions: "No instructions provided to explain." },
      "Spanish": { noInstructions: "No hay instrucciones proporcionadas para explicar." },
      "French": { noInstructions: "Aucune instruction fournie à expliquer." },
      "German": { noInstructions: "Keine Anweisungen zum Erklären bereitgestellt." },
      "Hindi": { noInstructions: "समझाने के लिए कोई निर्देश प्रदान नहीं किए गए।" },
      "Bengali": { noInstructions: "ব্যাখ্যা করার জন্য কোনো নির্দেশাবলী প্রদান করা হয়নি।" },
       // Add more languages as needed
  };
  const msg = messages[lang] || messages["English"];

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
2.  For each step, provide a **more detailed breakdown**. Explain the *why* behind the action (e.g., "Sauté onions until translucent to release their sweetness and build a flavor base...") and the *how* (e.g., "Use medium heat and stir occasionally to prevent burning...").
3.  **Define any culinary jargon** clearly (e.g., "Dicing means cutting into small, even cubes, about 1/4 inch...").
4.  **Offer practical tips and potential pitfalls** (e.g., "Don't overcrowd the pan when browning chicken, as it will steam instead of sear...", "If the sauce is too thin, you can simmer it longer...").
5.  **Maintain the original sequence** of steps but elaborate significantly on each one.
6.  Format the 'detailedExplanation' clearly using **numbered steps corresponding to the original**, with sub-points (like paragraphs or bullet points) for details, tips, and definitions. Ensure it's easy to read and follow.
7.  Focus solely on explaining the provided instructions. Do not add new steps or change the recipe core.

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
    const lang = input.language || "English"; // Use language name
    // Define messages based on language name
    const errorMessages: { [key: string]: { errorDefault: string; unexpectedError: string; busyError: string; configError: string; aiError: string; } } = {
         "English": { errorDefault: "Error: The AI instructor didn't provide an explanation. Please try again.", unexpectedError: "An unexpected error occurred while generating the explanation.", busyError: "The AI instructor is currently busy! Please try again in a moment.", configError: "There seems to be an issue with the AI configuration. Please contact support.", aiError: "AI Error: {message}." },
         "Spanish": { errorDefault: "Error: El instructor de IA no proporcionó una explicación. Inténtalo de nuevo.", unexpectedError: "Ocurrió un error inesperado al generar la explicación.", busyError: "¡El instructor de IA está ocupado! Inténtalo de nuevo en un momento.", configError: "Parece haber un problema con la configuración de la IA. Contacta al soporte.", aiError: "Error de IA: {message}." },
         "French": { errorDefault: "Erreur : L'instructeur IA n'a pas fourni d'explication. Veuillez réessayer.", unexpectedError: "Une erreur inattendue s'est produite lors de la génération de l'explication.", busyError: "L'instructeur IA est actuellement occupé ! Veuillez réessayer dans un instant.", configError: "Il semble y avoir un problème avec la configuration de l'IA. Veuillez contacter le support.", aiError: "Erreur IA : {message}." },
         "German": { errorDefault: "Fehler: Der KI-Lehrer hat keine Erklärung geliefert. Bitte versuchen Sie es erneut.", unexpectedError: "Beim Generieren der Erklärung ist ein unerwarteter Fehler aufgetreten.", busyError: "Der KI-Lehrer ist gerade beschäftigt! Bitte versuchen Sie es in einem Moment erneut.", configError: "Es scheint ein Problem mit der KI-Konfiguration zu geben. Bitte kontaktieren Sie den Support.", aiError: "KI-Fehler: {message}." },
         "Hindi": { errorDefault: "त्रुटि: एआई प्रशिक्षक ने स्पष्टीकरण प्रदान नहीं किया। कृपया पुन: प्रयास करें।", unexpectedError: "स्पष्टीकरण उत्पन्न करते समय एक अप्रत्याशित त्रुटि हुई।", busyError: "एआई प्रशिक्षक वर्तमान में व्यस्त है! कृपया थोड़ी देर में पुन: प्रयास करें।", configError: "एआई कॉन्फ़िगरेशन में कोई समस्या लगती है। कृपया सहायता से संपर्क करें।", aiError: "एआई त्रुटि: {message}।" },
         "Bengali": { errorDefault: "ত্রুটি: এআই প্রশিক্ষক একটি ব্যাখ্যা প্রদান করেনি। অনুগ্রহ করে আবার চেষ্টা করুন।", unexpectedError: "ব্যাখ্যা তৈরি করার সময় একটি অপ্রত্যাশিত ত্রুটি ঘটেছে।", busyError: "এআই প্রশিক্ষক বর্তমানে ব্যস্ত! অনুগ্রহ করে কিছুক্ষণ পরে আবার চেষ্টা করুন।", configError: "এআই কনফিগারেশনে সমস্যা আছে বলে মনে হচ্ছে। অনুগ্রহ করে সহায়তার সাথে যোগাযোগ করুন।", aiError: "এআই ত্রুটি: {message}।" },
          // Add more languages as needed
    };
    const msg = errorMessages[lang] || errorMessages["English"]; // Use lang (name) to get messages

    try {
      const { output } = await prompt(input);
      if (output && output.detailedExplanation) {
        // Ensure the explanation isn't just an error message itself
        if (output.detailedExplanation.startsWith("Error:")) {
             console.error("AI prompt (explainInstructions) returned an error message in output:", output.detailedExplanation);
             return {
                detailedExplanation: `${msg.errorDefault} (Received: ${output.detailedExplanation})`
             };
        }
        return output;
      } else {
        console.error("AI prompt (explainInstructions) returned null/undefined or empty explanation for input:", input);
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
        detailedExplanation: `Error (${lang}): ${errorMessage}`, // Use lang (name) in the error message
      };
    }
  }
);
