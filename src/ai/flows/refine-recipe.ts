
'use server';
/**
 * @fileOverview Refines a recipe based on user feedback about unavailable additional ingredients, supporting multiple languages.
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
  language: z
    .string()
    .optional()
    .describe('The desired language for the refined recipe output (e.g., "Spanish", "French", "German"). Default is English.'),
});
export type RefineRecipeInput = z.infer<typeof RefineRecipeInputSchema>;

// Schema for the output of the refinement flow
const RefineRecipeOutputSchema = z.object({
  refinedRecipeName: z.string().describe('The name of the refined recipe (can be the same or slightly modified, e.g., "Chicken Stir-Fry (No Broccoli)"). If refinement is impossible, indicate failure clearly (e.g., "Refinement Failed: Missing Key Ingredient").'),
  refinedIngredients: z.string().describe('A CLEARLY FORMATTED string listing the ingredients required for the *refined* recipe. Use Markdown lists or similar structure to differentiate between main and newly required additional ingredients. Example: "**Main:**\\n- Chicken\\n- Rice\\n**Additional:**\\n- Soy Sauce\\n- Oil\\n- Salt, Pepper"'),
  refinedInstructions: z.string().describe('The updated step-by-step instructions for the refined recipe. If refinement is impossible, state "No instructions applicable."'),
  feasibilityNotes: z.string().describe('Notes explaining the changes, substitutions, impact of omissions, or confirming the original is fine. If refinement is impossible, EXPLAIN CLEARLY why (e.g., "Cannot make sauce without soy sauce.").'),
}).describe('The refined recipe details, provided in the requested language (default English).');
export type RefineRecipeOutput = z.infer<typeof RefineRecipeOutputSchema>;


// Exported function that wraps the Genkit flow
export async function refineRecipe(input: RefineRecipeInput): Promise<RefineRecipeOutput> {
  const lang = input.language || "English";
  const messages = {
       "English": { failTitle: "Refinement Failed: Input Missing", ingredientsMsg: "Missing original recipe details.", instructionsMsg: "No instructions applicable.", notesMsg: "Cannot refine recipe without original name and instructions." },
       "Spanish": { failTitle: "Refinamiento Fallido: Entrada Faltante", ingredientsMsg: "Faltan detalles de la receta original.", instructionsMsg: "No hay instrucciones aplicables.", notesMsg: "No se puede refinar la receta sin el nombre y las instrucciones originales." },
       "French": { failTitle: "Échec du Raffinement : Entrée Manquante", ingredientsMsg: "Détails de la recette originale manquants.", instructionsMsg: "Aucune instruction applicable.", notesMsg: "Impossible de raffiner la recette sans le nom et les instructions d'origine." },
       "German": { failTitle: "Verfeinerung fehlgeschlagen: Eingabe fehlt", ingredientsMsg: "Originalrezeptdetails fehlen.", instructionsMsg: "Keine Anweisungen anwendbar.", notesMsg: "Rezept kann ohne Originalnamen und Anweisungen nicht verfeinert werden." },
       // Add more languages as needed
   };
   const msg = messages[lang as keyof typeof messages] || messages["English"];

  // Basic validation (though Zod handles schema)
  if (!input.originalRecipeName || !input.originalInstructions) {
     return {
        refinedRecipeName: msg.failTitle,
        refinedIngredients: msg.ingredientsMsg,
        refinedInstructions: msg.instructionsMsg,
        feasibilityNotes: msg.notesMsg,
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
{{#if language}}Generate the entire response (refinedRecipeName, refinedIngredients, refinedInstructions, feasibilityNotes) in {{language}}.{{else}}Generate the entire response in English.{{/if}}

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
    *   Generate 'refinedIngredients': a **clearly formatted string** (use Markdown lists like "**Main:**\\n- Item 1\\n**Additional:**\\n- Item 2" or translations) listing ONLY the ingredients *now* required. Include the original 'providedIngredients' and the *remaining* 'originalAdditionalIngredients'.
    *   Keep 'refinedRecipeName' similar or add a note (e.g., "{{{originalRecipeName}}} (No Onion)" or its translation).
    *   Write 'feasibilityNotes' explaining the changes (e.g., "Removed onion, flavour profile slightly changed.", "Substituted X for Y.") or confirming sufficiency ("All needed items available!").
4.  **If Not Feasible:**
    *   Set 'refinedRecipeName' to indicate failure (e.g., "Refinement Failed: {{{originalRecipeName}}} - Missing Crucial Item" or its translation).
    *   Explain clearly in 'feasibilityNotes' *why* it fails (e.g., "[Unavailable item] is essential for the sauce/structure.").
    *   Set 'refinedIngredients' to a message like "Refinement not possible." or its translation.
    *   Set 'refinedInstructions' to indicate no instructions (e.g., "No instructions applicable." or its translation).
5.  **If NO items were marked unavailable:**
    *   Set 'refinedRecipeName' to "{{{originalRecipeName}}} (Confirmed)" or its translation.
    *   Format the complete original ingredient list (provided + additional) clearly in 'refinedIngredients' using Markdown lists.
    *   Copy 'originalInstructions' to 'refinedInstructions'.
    *   Set 'feasibilityNotes' to "Great! All suggested ingredients are available. Proceed with the original recipe." or its translation.

**Output Format:** Respond strictly following the output schema: {refinedRecipeName: string, refinedIngredients: string (formatted markdown), refinedInstructions: string, feasibilityNotes: string}. All text fields must be in the requested language ({{#if language}}{{language}}{{else}}English{{/if}}).
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
     const lang = input.language || "English";
     const errorMessages = {
        "English": { aiErrorTitle: "AI Error: No Response", ingredientsMsg: "Failed to get refined ingredients from the AI model.", instructionsMsg: "Failed to get refined instructions.", notesMsg: "AI model did not return valid output during refinement. Please try again.", unexpectedErrorNotes: "An unexpected error occurred while refining the recipe.", busyNotes: "The AI chef is busy refining recipes! Please try again in a moment.", busyTitle: "AI Busy", configErrorNotes: "There seems to be an issue with the AI configuration. Please contact support.", configErrorTitle: "Configuration Error", aiErrorGenericNotes: "AI Error: {message}", aiErrorGenericTitle: "AI Error", defaultFailTitle: "Refinement Failed", defaultIngredients: "Ingredient details unavailable due to error.", defaultInstructions: "Instructions unavailable due to error.", defaultNotes: "No specific notes provided.", defaultIngredientsUnavailable: "Ingredient list unavailable.", defaultInstructionsUnavailable: "Instructions unavailable." },
        "Spanish": { aiErrorTitle: "Error de IA: Sin Respuesta", ingredientsMsg: "No se pudieron obtener los ingredientes refinados del modelo de IA.", instructionsMsg: "No se pudieron obtener las instrucciones refinadas.", notesMsg: "El modelo de IA no devolvió una salida válida durante el refinamiento. Inténtalo de nuevo.", unexpectedErrorNotes: "Ocurrió un error inesperado al refinar la receta.", busyNotes: "¡El chef de IA está ocupado refinando recetas! Inténtalo de nuevo en un momento.", busyTitle: "IA Ocupada", configErrorNotes: "Parece haber un problema con la configuración de la IA. Contacta al soporte.", configErrorTitle: "Error de Configuración", aiErrorGenericNotes: "Error de IA: {message}", aiErrorGenericTitle: "Error de IA", defaultFailTitle: "Refinamiento Fallido", defaultIngredients: "Detalles de ingredientes no disponibles debido a error.", defaultInstructions: "Instrucciones no disponibles debido a error.", defaultNotes: "No se proporcionaron notas específicas.", defaultIngredientsUnavailable: "Lista de ingredientes no disponible.", defaultInstructionsUnavailable: "Instrucciones no disponibles." },
        "French": { aiErrorTitle: "Erreur IA : Pas de Réponse", ingredientsMsg: "Impossible d'obtenir les ingrédients raffinés du modèle IA.", instructionsMsg: "Impossible d'obtenir les instructions raffinées.", notesMsg: "Le modèle IA n'a pas renvoyé de sortie valide lors du raffinement. Veuillez réessayer.", unexpectedErrorNotes: "Une erreur inattendue s'est produite lors du raffinement de la recette.", busyNotes: "Le chef IA est occupé à raffiner les recettes ! Veuillez réessayer dans un instant.", busyTitle: "IA Occupée", configErrorNotes: "Il semble y avoir un problème avec la configuration de l'IA. Veuillez contacter le support.", configErrorTitle: "Erreur de Configuration", aiErrorGenericNotes: "Erreur IA : {message}", aiErrorGenericTitle: "Erreur IA", defaultFailTitle: "Échec du Raffinement", defaultIngredients: "Détails des ingrédients non disponibles en raison d'une erreur.", defaultInstructions: "Instructions non disponibles en raison d'une erreur.", defaultNotes: "Aucune note spécifique fournie.", defaultIngredientsUnavailable: "Liste d'ingrédients non disponible.", defaultInstructionsUnavailable: "Instructions non disponibles." },
        "German": { aiErrorTitle: "KI-Fehler: Keine Antwort", ingredientsMsg: "Verfeinerte Zutaten konnten nicht vom KI-Modell abgerufen werden.", instructionsMsg: "Verfeinerte Anweisungen konnten nicht abgerufen werden.", notesMsg: "KI-Modell hat während der Verfeinerung keine gültige Ausgabe zurückgegeben. Bitte versuchen Sie es erneut.", unexpectedErrorNotes: "Beim Verfeinern des Rezepts ist ein unerwarteter Fehler aufgetreten.", busyNotes: "Der KI-Koch ist mit dem Verfeinern von Rezepten beschäftigt! Bitte versuchen Sie es in einem Moment erneut.", busyTitle: "KI beschäftigt", configErrorNotes: "Es scheint ein Problem mit der KI-Konfiguration zu geben. Bitte kontaktieren Sie den Support.", configErrorTitle: "Konfigurationsfehler", aiErrorGenericNotes: "KI-Fehler: {message}", aiErrorGenericTitle: "KI-Fehler", defaultFailTitle: "Verfeinerung fehlgeschlagen", defaultIngredients: "Zutatendetails aufgrund eines Fehlers nicht verfügbar.", defaultInstructions: "Anweisungen aufgrund eines Fehlers nicht verfügbar.", defaultNotes: "Keine spezifischen Hinweise bereitgestellt.", defaultIngredientsUnavailable: "Zutatenliste nicht verfügbar.", defaultInstructionsUnavailable: "Anweisungen nicht verfügbar." },
        // Add more languages as needed
     };
     const msg = errorMessages[lang as keyof typeof errorMessages] || errorMessages["English"];

     try {
        const {output} = await prompt(input);
        if (output) {
            // Ensure required fields are present (Zod should handle this)
             output.refinedIngredients = output.refinedIngredients || msg.defaultIngredientsUnavailable;
             output.refinedInstructions = output.refinedInstructions || msg.defaultInstructionsUnavailable;
             output.feasibilityNotes = output.feasibilityNotes || msg.defaultNotes;
            return output;
        } else {
            console.error("AI prompt (refineRecipe) returned null/undefined output for input:", input);
             return {
                refinedRecipeName: msg.aiErrorTitle,
                refinedIngredients: msg.ingredientsMsg,
                refinedInstructions: msg.instructionsMsg,
                feasibilityNotes: msg.notesMsg
             };
        }
     } catch (error) {
        console.error("Error in refineRecipeFlow:", error);
        let errorMessage = msg.unexpectedErrorNotes;
        let errorTitle = msg.defaultFailTitle;

         if (error instanceof Error) {
             if (error.message.includes('503') || error.message.includes('overloaded')) {
                 errorMessage = msg.busyNotes;
                 errorTitle = msg.busyTitle;
             } else if (error.message.includes('API key')) {
                  errorMessage = msg.configErrorNotes;
                  errorTitle = msg.configErrorTitle;
             } else {
                 errorMessage = msg.aiErrorGenericNotes.replace('{message}', error.message);
                 errorTitle = msg.aiErrorGenericTitle;
            }
         }
          return {
            refinedRecipeName: errorTitle,
            refinedIngredients: msg.defaultIngredients,
            refinedInstructions: msg.defaultInstructions,
            feasibilityNotes: errorMessage // Provide detailed error in notes
         };
     }
  }
);
