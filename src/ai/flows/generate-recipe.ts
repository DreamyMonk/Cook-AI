
'use server';

/**
 * @fileOverview An AI agent to generate recipes based on available ingredients, preferred language, and taste preference.
 *
 * - generateRecipe - A function that handles the recipe generation process.
 * - GenerateRecipeInput - The input type for the generateRecipe function.
 * - GenerateRecipeOutput - The return type for the generateRecipe function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

// Input schema: Add optional preferred dish type, language, and taste preference
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
    .describe('The desired language for the recipe output (e.g., "Spanish", "French", "German", "Hindi", "Bengali"). Default is English.'),
  tastePreference: z
    .string()
    .optional()
    .describe('Optional desired taste profile or cuisine type (e.g., "Indian", "Chinese", "Mediterranean", "Spicy"). Default is "Any".'),
});
export type GenerateRecipeInput = z.infer<typeof GenerateRecipeInputSchema>;

// Output schema: Add optional alternative dish types
const GenerateRecipeOutputSchema = z.object({
  recipeName: z.string().describe('The name of the generated recipe. If no recipe is possible, state that clearly (e.g., "Unable to Create Recipe").'),
  providedIngredients: z.array(z.string()).describe('List of the main ingredients PROVIDED BY THE USER that are actually USED in the recipe. This list might be a subset of the user input.'),
  additionalIngredients: z.array(z.string()).describe('List of additional ingredients needed for the recipe. Include common staples (like oil, salt, pepper) AND commonly found vegetables (like onion, garlic, carrots, bell peppers, celery) or other fridge staples (like eggs, soy sauce) if they logically complement the main ingredients to create a more complete dish. If no recipe is possible, this list should be empty.'),
  instructions: z.string().describe('Step-by-step instructions for preparing the recipe. If no recipe is possible, this field should be empty or state "No instructions applicable."'),
  alternativeDishTypes: z.array(z.string()).optional().describe('If the main ingredients are versatile, lists other distinct types of dishes (e.g., "Soup", "Salad", "Stir-fry") that could potentially be made. Omit if only one clear type is suitable or if input is too limited.'),
  notes: z.string().optional().describe('Optional brief notes about the recipe, substitutions, or why it might be simple/complex. Include notes if the taste preference could not be fully met. If no recipe is possible, explain why here (e.g., "Missing essential components for a cohesive dish.").')
}).describe('The generated recipe details, provided in the requested language (default English).');
export type GenerateRecipeOutput = z.infer<typeof GenerateRecipeOutputSchema>;

export async function generateRecipe(input: GenerateRecipeInput): Promise<GenerateRecipeOutput> {
  if (!input.ingredients || input.ingredients.trim().length === 0) {
      const lang = input.language || "English";
      // Define messages based on language name, not code
      const messages: { [key: string]: { title: string; instructions: string; notes: string } } = {
          "English": { title: "Input Error: No Ingredients", instructions: "No instructions applicable.", notes: "Please list the ingredients you have available." },
          "Spanish": { title: "Error de Entrada: Sin Ingredientes", instructions: "No hay instrucciones aplicables.", notes: "Por favor, enumera los ingredientes que tienes disponibles." },
          "French": { title: "Erreur d'Entrée : Aucun Ingrédient", instructions: "Aucune instruction applicable.", notes: "Veuillez lister les ingrédients dont vous disposez." },
          "German": { title: "Eingabefehler: Keine Zutaten", instructions: "Keine Anweisungen anwendbar.", notes: "Bitte listen Sie die verfügbaren Zutaten auf." },
          "Hindi": { title: "इनपुट त्रुटि: कोई सामग्री नहीं", instructions: "कोई निर्देश लागू नहीं।", notes: "कृपया आपके पास उपलब्ध सामग्री सूचीबद्ध करें।" },
          "Bengali": { title: "ইনপুট ত্রুটি: কোনো উপকরণ নেই", instructions: "কোনো নির্দেশাবলী প্রযোজ্য নয়।", notes: "আপনার কাছে উপলব্ধ উপকরণ তালিকাভুক্ত করুন।" },
          // Add more languages as needed
      };
      const msg = messages[lang] || messages["English"];
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
  prompt: `You are an expert chef tasked with creating a sensible recipe using ingredients provided by a user, considering their language and taste preference.
{{#if language}}Generate the entire response (recipeName, instructions, notes, etc.) in {{language}}.{{else}}Generate the entire response in English.{{/if}}

User's Available Ingredients: {{{ingredients}}}
{{#if preferredDishType}}User's Preferred Dish Type: {{{preferredDishType}}}{{/if}}
{{#if tastePreference}}User's Preferred Taste/Cuisine: {{{tastePreference}}}{{/if}}

Chef's Instructions:
1.  Analyze the user's ingredients: {{{ingredients}}}. These are the CORE components.
{{#if preferredDishType}}
2.  Prioritize creating a recipe that fits the '{{{preferredDishType}}}' category, using the core ingredients.
{{else}}
2.  Determine the most suitable type of dish based on the core ingredients (e.g., stir-fry, soup, baked dish, salad, pasta dish). Generate a suitable recipe name.
{{/if}}
{{#if tastePreference}}
3.  **Taste Preference:** Adapt the recipe (including additional ingredients and instructions) to align with the '{{{tastePreference}}}' profile if possible. Use typical spices, sauces, or techniques associated with that cuisine, IF they complement the core ingredients. Note any limitations in the 'notes' field if the preference cannot be fully met.
{{else}}
3.  **Taste Preference:** No specific preference mentioned; create a generally appealing recipe.
{{/if}}
4.  Determine which of the USER'S ingredients will actually be USED in the recipe. List ONLY these used ingredients under 'providedIngredients'.
5.  Identify any NECESSARY or highly complementary additional ingredients to make a sensible and more complete dish, considering the target taste preference. Include:
    *   Basic Staples: Cooking oil, salt, pepper.
    *   Common Aromatics/Vegetables: **onion, garlic, carrots, celery, bell peppers**.
    *   Other Common Fridge Items: **eggs, milk, butter, soy sauce, basic canned tomatoes, potatoes**.
    *   Cuisine-Specific Staples (if taste preference is given): Consider items like ginger, chili, specific spices (cumin, coriander, turmeric for Indian; soy sauce, sesame oil for Chinese), herbs (oregano, basil for Mediterranean), etc., ONLY if they fit the core ingredients and taste preference.
    *   Only include items that logically fit the main ingredients and the dish type/taste.
    *   List these under 'additionalIngredients'.
6.  Write clear, step-by-step 'instructions', adapted for the taste preference if applicable. The recipe MUST prominently feature the ingredients in 'providedIngredients'.
{{#unless preferredDishType}}
7.  **Assess Versatility:** After devising the primary recipe, consider if the CORE ingredients ({{{ingredients}}}) could *also* be used to make other *distinctly different types* of dishes (e.g., if you made a stir-fry, could they also make a soup or a casserole?), potentially fitting other taste preferences.
    *   If yes, list these alternative dish types (e.g., "Soup", "Salad", "Baked Dish") in the 'alternativeDishTypes' array.
    *   Be realistic; only suggest plausible alternatives. Do not list minor variations of the main recipe. Omit this field if the ingredients are not versatile or too limited.
{{/unless}}
8.  **Failure Condition:** If a reasonable recipe cannot be created (considering core ingredients, dish type, taste preference, and common additions):
    *   Set 'recipeName' to indicate failure (e.g., "Unable to Create Recipe" or its translation).
    *   Keep 'providedIngredients', 'additionalIngredients', and 'alternativeDishTypes' as empty arrays ([]).
    *   Set 'instructions' to indicate no instructions (e.g., "No instructions applicable." or its translation).
    *   Explain *why* in the 'notes' field (e.g., "Cannot create a '{{{tastePreference}}}' dish with these ingredients.").
9. Add brief, optional 'notes' for suggestions, explanations, or limitations (especially regarding taste preference).

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
    const errorMessages: { [key: string]: { noIngredientsTitle: string; noIngredientsNotes: string; aiErrorTitle: string; aiErrorNotes: string; unexpectedErrorNotes: string; busyNotes: string; busyTitle: string; configErrorNotes: string; configErrorTitle: string; aiErrorGenericNotes: string; aiErrorGenericTitle: string; defaultInstructions: string; defaultFailTitle: string; defaultFailInstructions: string; } } = {
          "English": { noIngredientsTitle: "Input Error: No Ingredients", noIngredientsNotes: "No ingredients were provided to the recipe generator.", aiErrorTitle: "AI Error: No Response", aiErrorNotes: "The AI model did not return a valid recipe response. Please try again.", unexpectedErrorNotes: "An unexpected error occurred while generating the recipe.", busyNotes: "The AI chef is currently very busy with requests! Please try again in a moment.", busyTitle: "AI Busy", configErrorNotes: "There seems to be an issue with the AI configuration. Please contact support.", configErrorTitle: "Configuration Error", aiErrorGenericNotes: "AI Error: {message}. Please check your input or try again later.", aiErrorGenericTitle: "AI Error", defaultInstructions: "No instructions applicable.", defaultFailTitle: "Generation Failed", defaultFailInstructions: "No instructions available due to error."},
          "Spanish": { noIngredientsTitle: "Error de Entrada: Sin Ingredientes", noIngredientsNotes: "No se proporcionaron ingredientes al generador de recetas.", aiErrorTitle: "Error de IA: Sin Respuesta", aiErrorNotes: "El modelo de IA no devolvió una respuesta de receta válida. Inténtalo de nuevo.", unexpectedErrorNotes: "Ocurrió un error inesperado al generar la receta.", busyNotes: "¡El chef de IA está muy ocupado con las solicitudes! Inténtalo de nuevo en un momento.", busyTitle: "IA Ocupada", configErrorNotes: "Parece haber un problema con la configuración de la IA. Contacta al soporte.", configErrorTitle: "Error de Configuración", aiErrorGenericNotes: "Error de IA: {message}. Revisa tu entrada o inténtalo más tarde.", aiErrorGenericTitle: "Error de IA", defaultInstructions: "No hay instrucciones aplicables.", defaultFailTitle: "Generación Fallida", defaultFailInstructions: "Instrucciones no disponibles debido a error."},
          "French": { noIngredientsTitle: "Erreur d'Entrée : Aucun Ingrédient", noIngredientsNotes: "Aucun ingrédient n'a été fourni au générateur de recettes.", aiErrorTitle: "Erreur IA : Pas de Réponse", aiErrorNotes: "Le modèle IA n'a pas renvoyé de réponse de recette valide. Veuillez réessayer.", unexpectedErrorNotes: "Une erreur inattendue s'est produite lors de la génération de la recette.", busyNotes: "Le chef IA est actuellement très occupé par les demandes ! Veuillez réessayer dans un instant.", busyTitle: "IA Occupée", configErrorNotes: "Il semble y avoir un problème avec la configuration de l'IA. Veuillez contacter le support.", configErrorTitle: "Erreur de Configuration", aiErrorGenericNotes: "Erreur IA : {message}. Veuillez vérifier votre saisie ou réessayer plus tard.", aiErrorGenericTitle: "Erreur IA", defaultInstructions: "Aucune instruction applicable.", defaultFailTitle: "Échec de la Génération", defaultFailInstructions: "Instructions non disponibles en raison d'une erreur."},
          "German": { noIngredientsTitle: "Eingabefehler: Keine Zutaten", noIngredientsNotes: "Dem Rezeptgenerator wurden keine Zutaten zur Verfügung gestellt.", aiErrorTitle: "KI-Fehler: Keine Antwort", aiErrorNotes: "Das KI-Modell hat keine gültige Rezeptantwort zurückgegeben. Bitte versuchen Sie es erneut.", unexpectedErrorNotes: "Beim Generieren des Rezepts ist ein unerwarteter Fehler aufgetreten.", busyNotes: "Der KI-Koch ist derzeit sehr beschäftigt! Bitte versuchen Sie es in einem Moment erneut.", busyTitle: "KI beschäftigt", configErrorNotes: "Es scheint ein Problem mit der KI-Konfiguration zu geben. Bitte kontaktieren Sie den Support.", configErrorTitle: "Konfigurationsfehler", aiErrorGenericNotes: "KI-Fehler: {message}. Bitte überprüfen Sie Ihre Eingabe oder versuchen Sie es später erneut.", aiErrorGenericTitle: "KI-Fehler", defaultInstructions: "Keine Anweisungen anwendbar.", defaultFailTitle: "Generierung fehlgeschlagen", defaultFailInstructions: "Anweisungen aufgrund eines Fehlers nicht verfügbar."},
          "Hindi": { noIngredientsTitle: "इनपुट त्रुटि: कोई सामग्री नहीं", noIngredientsNotes: "रेसिपी जनरेटर को कोई सामग्री प्रदान नहीं की गई।", aiErrorTitle: "एआई त्रुटि: कोई प्रतिक्रिया नहीं", aiErrorNotes: "एआई मॉडल ने मान्य रेसिपी प्रतिक्रिया नहीं दी। कृपया पुन: प्रयास करें।", unexpectedErrorNotes: "रेसिपी बनाते समय एक अप्रत्याशित त्रुटि हुई।", busyNotes: "एआई शेफ वर्तमान में अनुरोधों के साथ बहुत व्यस्त है! कृपया थोड़ी देर में पुन: प्रयास करें।", busyTitle: "एआई व्यस्त", configErrorNotes: "एआई कॉन्फ़िगरेशन में कोई समस्या लगती है। कृपया सहायता से संपर्क करें।", configErrorTitle: "कॉन्फ़िगरेशन त्रुटि", aiErrorGenericNotes: "एआई त्रुटि: {message}। कृपया अपनी इनपुट जांचें या बाद में पुन: प्रयास करें।", aiErrorGenericTitle: "एआई त्रुटि", defaultInstructions: "कोई निर्देश लागू नहीं।", defaultFailTitle: "उत्पादन विफल", defaultFailInstructions: "त्रुटि के कारण निर्देश उपलब्ध नहीं हैं।"},
          "Bengali": { noIngredientsTitle: "ইনপুট ত্রুটি: কোনো উপকরণ নেই", noIngredientsNotes: "রেসিপি জেনারেটরে কোনো উপকরণ দেওয়া হয়নি।", aiErrorTitle: "এআই ত্রুটি: কোনো প্রতিক্রিয়া নেই", aiErrorNotes: "এআই মডেল একটি বৈধ রেসিপি প্রতিক্রিয়া ফেরত দেয়নি। অনুগ্রহ করে আবার চেষ্টা করুন।", unexpectedErrorNotes: "রেসিপি তৈরি করার সময় একটি অপ্রত্যাশিত ত্রুটি ঘটেছে।", busyNotes: "এআই শেফ বর্তমানে অনুরোধ নিয়ে খুব ব্যস্ত! অনুগ্রহ করে কিছুক্ষণ পরে আবার চেষ্টা করুন।", busyTitle: "এআই ব্যস্ত", configErrorNotes: "এআই কনফিগারেশনে সমস্যা আছে বলে মনে হচ্ছে। অনুগ্রহ করে সহায়তার সাথে যোগাযোগ করুন।", configErrorTitle: "কনফিগারেশন ত্রুটি", aiErrorGenericNotes: "এআই ত্রুটি: {message}। অনুগ্রহ করে আপনার ইনপুট পরীক্ষা করুন বা পরে আবার চেষ্টা করুন।", aiErrorGenericTitle: "এআই ত্রুটি", defaultInstructions: "কোনো নির্দেশাবলী প্রযোজ্য নয়।", defaultFailTitle: "উৎপন্ন করতে ব্যর্থ", defaultFailInstructions: "ত্রুটির কারণে নির্দেশাবলী উপলব্ধ নেই।"},
           // Add more languages as needed
      };
     const msg = errorMessages[lang] || errorMessages["English"];


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
             output.instructions = output.instructions || (msg.defaultInstructions + ` (${lang})`); // Provide default if empty
             return output;
        } else {
             // Handle unexpected null/undefined output from the prompt
             console.error("AI prompt returned null/undefined output for input:", input);
             return {
                recipeName: msg.aiErrorTitle,
                providedIngredients: [],
                additionalIngredients: [],
                instructions: msg.defaultInstructions + ` (AI Error - ${lang})`,
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
            recipeName: errorTitle + ` (${lang})`,
            providedIngredients: [],
            additionalIngredients: [],
            instructions: msg.defaultFailInstructions,
            notes: errorMessage,
            alternativeDishTypes: [],
         };
    }
  }
);
