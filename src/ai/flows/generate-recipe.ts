
'use server';

/**
 * @fileOverview An AI agent to generate recipes based on available ingredients and preferred language.
 *
 * - generateRecipe - A function that handles the recipe generation process.
 * - GenerateRecipeInput - The input type for the generateRecipe function.
 * - GenerateRecipeOutput - The return type for the generateRecipe function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

// Input schema: Add optional preferred dish type and language
const GenerateRecipeInputSchema = z.object({
  ingredients: z
    .string()
    .describe('A comma-separated list of ingredients the user claims to have available.'),
  preferredDishType: z
    .string()
    .optional()
    .describe('If specified, guides the AI to generate a recipe matching this type (e.g., "soup", "stir-fry", "salad", "baked dish").'),
  language: z
    .string()
    .optional()
    .describe('The desired language for the recipe output (e.g., "Spanish", "French", "German"). Default is English.'),
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
}).describe('The generated recipe details, provided in the requested language (default English).');
export type GenerateRecipeOutput = z.infer<typeof GenerateRecipeOutputSchema>;

export async function generateRecipe(input: GenerateRecipeInput): Promise<GenerateRecipeOutput> {
  if (!input.ingredients || input.ingredients.trim().length === 0) {
      const lang = input.language || "English";
      const messages = {
          "English": { title: "Input Error: No Ingredients", instructions: "No instructions applicable.", notes: "Please list the ingredients you have available." },
          "Spanish": { title: "Error de Entrada: Sin Ingredientes", instructions: "No hay instrucciones aplicables.", notes: "Por favor, enumera los ingredientes que tienes disponibles." },
          "French": { title: "Erreur d'Entrée : Aucun Ingrédient", instructions: "Aucune instruction applicable.", notes: "Veuillez lister les ingrédients dont vous disposez." },
          "German": { title: "Eingabefehler: Keine Zutaten", instructions: "Keine Anweisungen anwendbar.", notes: "Bitte listen Sie die verfügbaren Zutaten auf." },
          // Add more languages as needed
      };
      const msg = messages[lang as keyof typeof messages] || messages["English"];
      return {
          recipeName: msg.title,
          providedIngredients: [],
          additionalIngredients: [],
          instructions: msg.instructions,
          notes: msg.notes,
          alternativeDishTypes: [],
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
{{#if language}}Generate the entire response (recipeName, instructions, notes, etc.) in {{language}}.{{else}}Generate the entire response in English.{{/if}}

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
    *   Set 'recipeName' to indicate failure (e.g., "Unable to Create Recipe" or its translation).
    *   Keep 'providedIngredients', 'additionalIngredients', and 'alternativeDishTypes' as empty arrays ([] or undefined).
    *   Set 'instructions' to indicate no instructions (e.g., "No instructions applicable." or its translation).
    *   Explain *why* in the 'notes' field.
8. Add brief, optional 'notes' for suggestions or explanations.

Respond strictly following the output schema structure, ensuring all text fields are in the requested language ({{#if language}}{{language}}{{else}}English{{/if}}). Ensure 'providedIngredients', 'additionalIngredients', and 'alternativeDishTypes' (if present) are ALWAYS arrays of strings, even if empty.
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
    const lang = input.language || "English";
    const errorMessages = {
          "English": { noIngredientsTitle: "Input Error: No Ingredients", noIngredientsNotes: "No ingredients were provided to the recipe generator.", aiErrorTitle: "AI Error: No Response", aiErrorNotes: "The AI model did not return a valid recipe response. Please try again.", unexpectedErrorNotes: "An unexpected error occurred while generating the recipe.", busyNotes: "The AI chef is currently very busy with requests! Please try again in a moment.", busyTitle: "AI Busy", configErrorNotes: "There seems to be an issue with the AI configuration. Please contact support.", configErrorTitle: "Configuration Error", aiErrorGenericNotes: "AI Error: {message}. Please check your input or try again later.", aiErrorGenericTitle: "AI Error", defaultInstructions: "No instructions applicable.", defaultFailTitle: "Generation Failed", defaultFailInstructions: "No instructions available due to error."},
          "Spanish": { noIngredientsTitle: "Error de Entrada: Sin Ingredientes", noIngredientsNotes: "No se proporcionaron ingredientes al generador de recetas.", aiErrorTitle: "Error de IA: Sin Respuesta", aiErrorNotes: "El modelo de IA no devolvió una respuesta de receta válida. Inténtalo de nuevo.", unexpectedErrorNotes: "Ocurrió un error inesperado al generar la receta.", busyNotes: "¡El chef de IA está muy ocupado con las solicitudes! Inténtalo de nuevo en un momento.", busyTitle: "IA Ocupada", configErrorNotes: "Parece haber un problema con la configuración de la IA. Contacta al soporte.", configErrorTitle: "Error de Configuración", aiErrorGenericNotes: "Error de IA: {message}. Revisa tu entrada o inténtalo más tarde.", aiErrorGenericTitle: "Error de IA", defaultInstructions: "No hay instrucciones aplicables.", defaultFailTitle: "Generación Fallida", defaultFailInstructions: "Instrucciones no disponibles debido a error."},
          "French": { noIngredientsTitle: "Erreur d'Entrée : Aucun Ingrédient", noIngredientsNotes: "Aucun ingrédient n'a été fourni au générateur de recettes.", aiErrorTitle: "Erreur IA : Pas de Réponse", aiErrorNotes: "Le modèle IA n'a pas renvoyé de réponse de recette valide. Veuillez réessayer.", unexpectedErrorNotes: "Une erreur inattendue s'est produite lors de la génération de la recette.", busyNotes: "Le chef IA est actuellement très occupé par les demandes ! Veuillez réessayer dans un instant.", busyTitle: "IA Occupée", configErrorNotes: "Il semble y avoir un problème avec la configuration de l'IA. Veuillez contacter le support.", configErrorTitle: "Erreur de Configuration", aiErrorGenericNotes: "Erreur IA : {message}. Veuillez vérifier votre saisie ou réessayer plus tard.", aiErrorGenericTitle: "Erreur IA", defaultInstructions: "Aucune instruction applicable.", defaultFailTitle: "Échec de la Génération", defaultFailInstructions: "Instructions non disponibles en raison d'une erreur."},
          "German": { noIngredientsTitle: "Eingabefehler: Keine Zutaten", noIngredientsNotes: "Dem Rezeptgenerator wurden keine Zutaten zur Verfügung gestellt.", aiErrorTitle: "KI-Fehler: Keine Antwort", aiErrorNotes: "Das KI-Modell hat keine gültige Rezeptantwort zurückgegeben. Bitte versuchen Sie es erneut.", unexpectedErrorNotes: "Beim Generieren des Rezepts ist ein unerwarteter Fehler aufgetreten.", busyNotes: "Der KI-Koch ist derzeit sehr beschäftigt! Bitte versuchen Sie es in einem Moment erneut.", busyTitle: "KI beschäftigt", configErrorNotes: "Es scheint ein Problem mit der KI-Konfiguration zu geben. Bitte kontaktieren Sie den Support.", configErrorTitle: "Konfigurationsfehler", aiErrorGenericNotes: "KI-Fehler: {message}. Bitte überprüfen Sie Ihre Eingabe oder versuchen Sie es später erneut.", aiErrorGenericTitle: "KI-Fehler", defaultInstructions: "Keine Anweisungen anwendbar.", defaultFailTitle: "Generierung fehlgeschlagen", defaultFailInstructions: "Anweisungen aufgrund eines Fehlers nicht verfügbar."},
           // Add more languages as needed
      };
     const msg = errorMessages[lang as keyof typeof errorMessages] || errorMessages["English"];


    if (!input.ingredients || input.ingredients.trim().length === 0) {
        return {
            recipeName: msg.noIngredientsTitle,
            providedIngredients: [],
            additionalIngredients: [],
            instructions: msg.defaultInstructions,
            notes: msg.noIngredientsNotes,
            alternativeDishTypes: [],
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
             output.instructions = output.instructions || (msg.defaultInstructions + " (Generated)"); // Provide default if empty
             return output;
        } else {
             // Handle unexpected null/undefined output from the prompt
             console.error("AI prompt returned null/undefined output for input:", input);
             return {
                recipeName: msg.aiErrorTitle,
                providedIngredients: [],
                additionalIngredients: [],
                instructions: msg.defaultInstructions + " (AI Error)",
                notes: msg.aiErrorNotes,
                alternativeDishTypes: [],
             };
        }
    } catch (error) {
        console.error("Error in generateRecipeFlow:", error);
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
            recipeName: errorTitle,
            providedIngredients: [],
            additionalIngredients: [],
            instructions: msg.defaultFailInstructions,
            notes: errorMessage,
            alternativeDishTypes: [],
         };
    }
  }
);
