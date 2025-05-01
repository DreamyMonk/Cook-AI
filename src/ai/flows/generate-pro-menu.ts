
'use server';
/**
 * @fileOverview An AI agent to generate a multi-course menu for an event based on available ingredients, theme, guest count, selected courses, and preferences.
 *
 * - generateProMenu - A function that handles the professional menu generation process.
 * - GenerateProMenuInput - The input type for the generateProMenu function.
 * - GenerateProMenuOutput - The return type for the generateProMenu function.
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';
import type { CourseType } from '@/app/page'; // Import shared types

// --- Input Schema ---
// Note: This schema constant is NOT exported
const GenerateProMenuInputSchema = z.object({
  ingredients: z
    .string()
    .describe('A comma-separated list of main ingredients the user has available.'),
  eventTheme: z
    .string()
    .describe('The theme or name of the event (e.g., "Summer BBQ", "Birthday Dinner", "Casual Get-together").'),
  numGuests: z
    .number()
    .int()
    .positive()
    .describe('The number of guests attending the event.'),
  courses: z
    .array(z.enum(['starter', 'main', 'dessert'])) // Use imported CourseType enum values
    .min(1)
    .describe('An array of course types requested for the menu (e.g., ["starter", "main"]).'),
  preferences: z
    .string()
    .optional()
    .describe('Optional dietary restrictions, preferences, or specific requests (e.g., "Vegetarian main needed", "No nuts", "Focus on seafood").'),
  language: z
    .string()
    .optional()
    .describe('The desired language for the menu output (e.g., "Spanish", "French"). Default is English.'),
  tastePreference: z
    .string()
    .optional()
    .describe('Optional overarching desired taste profile or cuisine type for the menu (e.g., "Italian", "Asian Fusion"). Default is "Any".'),
});
export type GenerateProMenuInput = z.infer<typeof GenerateProMenuInputSchema>;

// --- Output Schema ---
const ProCourseSchema = z.object({
    type: z.enum(['starter', 'main', 'dessert']).describe("The type of the course."),
    recipeName: z.string().describe("The name of the recipe for this course."),
    ingredients: z.string().describe("A clearly formatted list (e.g., using markdown like '**Provided:**\\n- Item (Quantity)\\n**Additional:**\\n- Item (Quantity)...') of ALL ingredients required for this specific course recipe, including estimated quantities scaled appropriately for the specified number of guests. Clearly differentiate between ingredients assumed to be provided by the user (from their input list) and additional ingredients required."),
    instructions: z.string().describe("Step-by-step instructions for preparing this specific course recipe."),
});
export type ProCourse = z.infer<typeof ProCourseSchema>;

// Note: This schema constant is NOT exported
const GenerateProMenuOutputSchema = z.object({
  menuTitle: z.string().describe('A suitable title for the generated menu, reflecting the event theme and potentially the core ingredients. If generation fails, indicate failure (e.g., "Menu Generation Failed").'),
  eventTheme: z.string().describe('The event theme provided by the user.'), // Echo back theme
  numGuests: z.number().describe('The number of guests the menu is designed for.'), // Echo back guests
  courses: z.array(ProCourseSchema).describe("An array containing the details for each generated course recipe."),
  chefNotes: z.string().optional().describe('Optional comprehensive overall notes from the chef. Explain the menu choices, how user ingredients were used, suggest pairings or timing, discuss potential challenges, substitutions, or explain clearly why generation might have failed (e.g., "Insufficient ingredients...", "Difficulty matching theme...").')
}).describe('The generated multi-course menu details, provided in the requested language (default English).');
export type GenerateProMenuOutput = z.infer<typeof GenerateProMenuOutputSchema>;


// --- Exported Function ---
export async function generateProMenu(input: GenerateProMenuInput): Promise<GenerateProMenuOutput> {
  // Basic input validation (covered by Zod, but good practice)
  if (!input.ingredients || input.ingredients.trim().length === 0) {
    const lang = input.language || "English";
    const msg = getErrorMessages(lang).noIngredients;
    return { menuTitle: msg.title, eventTheme: input.eventTheme, numGuests: input.numGuests, courses: [], chefNotes: msg.notes };
  }
  if (input.courses.length === 0) {
      const lang = input.language || "English";
      const msg = getErrorMessages(lang).noCourses;
      return { menuTitle: msg.title, eventTheme: input.eventTheme, numGuests: input.numGuests, courses: [], chefNotes: msg.notes };
  }

  return generateProMenuFlow(input);
}

// --- Genkit Prompt ---
const proPrompt = ai.definePrompt({
  name: 'generateProMenuPrompt',
  // Use Gemini 1.5 Pro for potentially better complex menu planning
  model: 'googleai/gemini-1.5-pro',
  input: { schema: GenerateProMenuInputSchema },
  output: { schema: GenerateProMenuOutputSchema },
  prompt: `You are an expert Pro Chef creating a cohesive multi-course menu for an event based on limited user-provided ingredients and specific requirements.
{{#if language}}Generate the entire response (menuTitle, course names, ingredients, instructions, chefNotes) in {{language}}.{{else}}Generate the entire response in English.{{/if}}

**Event Details:**
- Theme: {{{eventTheme}}}
- Number of Guests: {{numGuests}}
- User's Available Ingredients: {{{ingredients}}}
- Requested Courses: {{#each courses}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
{{#if tastePreference}}- Overarching Taste Preference: {{{tastePreference}}}{{/if}}
{{#if preferences}}- Additional Preferences/Restrictions: {{{preferences}}}{{/if}}

**Chef's Task:**
1.  **Prioritize User Input:** The user's available ingredients ({{{ingredients}}}), theme ({{{eventTheme}}}), guest count ({{numGuests}}), course selection ({{#each courses}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}), and preferences ({{{preferences}}}, {{{tastePreference}}}) are the *primary* constraints. Build the menu around these.
2.  **Analyze Core Ingredients:** Review the user's {{{ingredients}}}. Determine if they are sufficient *foundation* for the requested number of courses ({{courses.length}} courses for {{numGuests}} guests).
3.  **Failure Condition:** If the core ingredients are fundamentally insufficient or completely unsuitable for the requested courses/theme/preferences (even with reasonable additions), **indicate failure**:
    *   Set 'menuTitle' to indicate failure (e.g., "Menu Generation Failed" or its translation).
    *   Keep 'courses' as an empty array ([]).
    *   Explain the reason clearly and comprehensively in 'chefNotes' (e.g., "Cannot create {{courses.length}} distinct courses for {{numGuests}} guests with only {{{ingredients}}}. Key components missing for requested style.", "Ingredients conflict strongly with requested '{{{tastePreference}}}' preference.").
    *   **STOP HERE if failure is indicated.**
4.  **Menu Planning (If Feasible):**
    *   Devise a *cohesive* menu featuring the requested courses ({{#each courses}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}), respecting the theme and preferences.
    *   Generate a suitable 'menuTitle' reflecting the theme and perhaps key ingredients.
    *   For EACH requested course:
        *   Design a specific recipe ('recipeName') appropriate for the course type (starter, main, dessert) and event theme.
        *   **Maximize use of the user's {{{ingredients}}}** across the different courses where sensible.
        *   Determine **ALL** necessary ingredients for *that specific recipe* scaled for *{{numGuests}} guests*. Format this in the 'ingredients' field for the course using **Markdown lists**, clearly differentiating user-provided vs. additional items and including **estimated quantities**. Example Format:
            \`\`\`markdown
            **Provided:**
            - Chicken (approx. {{calculateQuantity 'chicken' numGuests}} lbs)
            - Rice (approx. {{calculateQuantity 'rice' numGuests}} cups dry)
            **Additional:**
            - Onion ({{calculateQuantity 'onion' numGuests}} large, diced)
            - Olive Oil ({{calculateQuantity 'olive_oil' numGuests}} cup)
            - Garlic ({{calculateQuantity 'garlic' numGuests}} cloves, minced)
            - Salt & Pepper (to taste)
            - Specific spices... (Quantity)
            \`\`\`
            (You need to estimate appropriate quantities based on standard recipe scaling for {{numGuests}} guests).
        *   Write clear, step-by-step 'instructions' for preparing *that specific course*.
        *   Ensure the recipe aligns with the overall '{{{tastePreference}}}' (if specified) and respects '{{{preferences}}}'.
5.  **Chef Notes (Crucial):** Provide *comprehensive* 'chefNotes'. Explain *why* you made certain menu choices. Describe how the user's main ingredients were incorporated. Suggest drink pairings or a preparation timeline if applicable. Discuss any challenges faced (e.g., ingredient limitations affecting authenticity of taste preference) and suggest potential simple substitutions (that don't require new, complex ingredients). Make this section insightful and helpful, like a real chef consulting.

**Output Format:** Respond *strictly* following the output schema: {menuTitle: string, eventTheme: string, numGuests: number, courses: [{type: string, recipeName: string, ingredients: string, instructions: string}], chefNotes?: string}. Ensure all text is in the requested language ({{#if language}}{{language}}{{else}}English{{/if}}). 'courses' MUST be an array, even if empty on failure. Ingredient quantities MUST be estimated for {{numGuests}}.
`,
});

// --- Genkit Flow ---
const generateProMenuFlow = ai.defineFlow<
  typeof GenerateProMenuInputSchema,
  typeof GenerateProMenuOutputSchema
>(
  {
    name: 'generateProMenuFlow',
    inputSchema: GenerateProMenuInputSchema,
    outputSchema: GenerateProMenuOutputSchema,
  },
  async (input) => {
    const lang = input.language || "English";
    const msg = getErrorMessages(lang).flowError;

    try {
      // Using the specific Pro model defined in the prompt
      const { output } = await proPrompt(input);

      if (output) {
         // Ensure courses array is always present
         output.courses = output.courses ?? [];

         // Post-processing: If AI indicates failure in title but provides no/generic notes, add a default note.
         if ((output.menuTitle.includes("Failed") || output.menuTitle.includes("Error")) && (!output.chefNotes || output.chefNotes.length < 20)) { // Check for empty or very short notes
             output.chefNotes = msg.defaultFailNotesInsufficient;
         }
         // Check if AI returned success title but empty courses (likely indicates failure)
         else if (!(output.menuTitle.includes("Failed") || output.menuTitle.includes("Error")) && output.courses.length === 0 && input.courses.length > 0) { // Check if courses were requested but none generated
              console.warn("AI generated success title but no courses for pro menu input:", input);
              output.menuTitle = msg.defaultFailTitle + ` (${lang})`;
              output.chefNotes = msg.defaultFailNotesInsufficient;
         }
         // Ensure chef notes are present if generation succeeded but notes are missing
         else if (!(output.menuTitle.includes("Failed") || output.menuTitle.includes("Error")) && output.courses.length > 0 && !output.chefNotes) {
             output.chefNotes = msg.defaultSuccessNotes; // Add a default success note if missing
         }


        return output;
      } else {
        // Handle unexpected null/undefined output
        console.error("AI prompt (generateProMenu) returned null/undefined output for input:", input);
        return {
          menuTitle: msg.aiErrorTitle + ` (${lang})`,
          eventTheme: input.eventTheme,
          numGuests: input.numGuests,
          courses: [],
          chefNotes: msg.aiErrorNotes,
        };
      }
    } catch (error) {
      console.error("Error in generateProMenuFlow:", error);
      let errorMessage = msg.unexpectedErrorNotes;
      let errorTitle = msg.defaultFailTitle;

      if (error instanceof Error) {
        // Customize error messages based on potential issues
        if (error.message.includes('503') || error.message.includes('overloaded')) {
             errorMessage = msg.busyNotes;
             errorTitle = msg.busyTitle;
        } else if (error.message.includes('API key')) {
             errorMessage = msg.configErrorNotes;
             errorTitle = msg.configErrorTitle;
        } else if (error.message.includes('insufficient') || error.message.includes('Cannot create')) {
             errorTitle = msg.defaultFailTitle + ` (${lang})`;
             errorMessage = msg.defaultFailNotesInsufficient;
        } else {
             errorMessage = msg.aiErrorGenericNotes.replace('{message}', error.message);
             errorTitle = msg.aiErrorGenericTitle + ` (${lang})`;
        }
      }
      return {
        menuTitle: errorTitle,
        eventTheme: input.eventTheme,
        numGuests: input.numGuests,
        courses: [],
        chefNotes: errorMessage,
      };
    }
  }
);


// --- Helper for Localized Error Messages ---
function getErrorMessages(lang: string) {
    const messages: { [key: string]: any } = {
       "en": {
           noIngredients: { title: "Input Error: No Ingredients", notes: "Please provide the available ingredients." },
           noCourses: { title: "Input Error: No Courses Selected", notes: "Please select at least one course for the menu." },
           flowError: { aiErrorTitle: "AI Error: No Response", aiErrorNotes: "The AI chef didn't return a menu. Please try again.", unexpectedErrorNotes: "An unexpected error occurred while generating the menu.", busyNotes: "The AI chef is busy planning menus! Please try again.", busyTitle: "AI Busy", configErrorNotes: "There seems to be an issue with the AI configuration.", configErrorTitle: "Configuration Error", aiErrorGenericNotes: "AI Error: {message}", aiErrorGenericTitle: "AI Error", defaultFailTitle: "Menu Generation Failed", defaultFailNotesInsufficient: "Could not generate menu. Ingredients may be insufficient or unsuitable for the request.", defaultSuccessNotes: "Menu generated successfully. Review the courses and chef's notes for details." }
       },
       "es": {
           noIngredients: { title: "Error de Entrada: Sin Ingredientes", notes: "Proporciona los ingredientes disponibles." },
           noCourses: { title: "Error de Entrada: No hay Cursos Seleccionados", notes: "Selecciona al menos un curso para el menú." },
           flowError: { aiErrorTitle: "Error de IA: Sin Respuesta", aiErrorNotes: "El chef IA no devolvió un menú. Inténtalo de nuevo.", unexpectedErrorNotes: "Ocurrió un error inesperado al generar el menú.", busyNotes: "¡El chef IA está ocupado planeando menús! Inténtalo de nuevo.", busyTitle: "IA Ocupada", configErrorNotes: "Parece haber un problema con la configuración de la IA.", configErrorTitle: "Error de Configuración", aiErrorGenericNotes: "Error de IA: {message}", aiErrorGenericTitle: "Error de IA", defaultFailTitle: "Falló la Generación del Menú", defaultFailNotesInsufficient: "No se pudo generar el menú. Los ingredientes pueden ser insuficientes o inadecuados.", defaultSuccessNotes: "Menú generado con éxito. Revisa los cursos y las notas del chef para más detalles." }
       },
       "fr": {
            noIngredients: { title: "Erreur d'Entrée : Aucun Ingrédient", notes: "Veuillez fournir les ingrédients disponibles." },
            noCourses: { title: "Erreur d'Entrée : Aucun Plat Sélectionné", notes: "Veuillez sélectionner au moins un plat pour le menu." },
            flowError: { aiErrorTitle: "Erreur IA : Pas de Réponse", aiErrorNotes: "Le chef IA n'a pas renvoyé de menu. Veuillez réessayer.", unexpectedErrorNotes: "Une erreur inattendue s'est produite lors de la génération du menu.", busyNotes: "Le chef IA est occupé à planifier des menus ! Veuillez réessayer.", busyTitle: "IA Occupée", configErrorNotes: "Il semble y avoir un problème avec la configuration de l'IA.", configErrorTitle: "Erreur de Configuration", aiErrorGenericNotes: "Erreur IA : {message}", aiErrorGenericTitle: "Erreur IA", defaultFailTitle: "Échec de la Génération du Menu", defaultFailNotesInsufficient: "Impossible de générer le menu. Les ingrédients sont peut-être insuffisants ou inadaptés.", defaultSuccessNotes: "Menu généré avec succès. Examinez les plats et les notes du chef pour plus de détails." }
        },
       "de": {
            noIngredients: { title: "Eingabefehler: Keine Zutaten", notes: "Bitte geben Sie die verfügbaren Zutaten an." },
            noCourses: { title: "Eingabefehler: Keine Gänge ausgewählt", notes: "Bitte wählen Sie mindestens einen Gang für das Menü aus." },
            flowError: { aiErrorTitle: "KI-Fehler: Keine Antwort", aiErrorNotes: "Der KI-Koch hat kein Menü zurückgegeben. Bitte versuchen Sie es erneut.", unexpectedErrorNotes: "Beim Generieren des Menüs ist ein unerwarteter Fehler aufgetreten.", busyNotes: "Der KI-Koch ist mit der Menüplanung beschäftigt! Bitte versuchen Sie es erneut.", busyTitle: "KI beschäftigt", configErrorNotes: "Es scheint ein Problem mit der KI-Konfiguration zu geben.", configErrorTitle: "Konfigurationsfehler", aiErrorGenericNotes: "KI-Fehler: {message}", aiErrorGenericTitle: "KI-Fehler", defaultFailTitle: "Menügenerierung fehlgeschlagen", defaultFailNotesInsufficient: "Menü konnte nicht generiert werden. Zutaten möglicherweise unzureichend oder ungeeignet.", defaultSuccessNotes: "Menü erfolgreich generiert. Überprüfen Sie die Gänge und die Notizen des Kochs für Details." }
        },
        "hi": {
            noIngredients: { title: "इनपुट त्रुटि: कोई सामग्री नहीं", notes: "कृपया उपलब्ध सामग्री प्रदान करें।" },
            noCourses: { title: "इनपुट त्रुटि: कोई कोर्स चयनित नहीं", notes: "कृपया मेनू के लिए कम से कम एक कोर्स चुनें।" },
            flowError: { aiErrorTitle: "एआई त्रुटि: कोई प्रतिक्रिया नहीं", aiErrorNotes: "एआई शेफ ने मेनू वापस नहीं किया। कृपया पुनः प्रयास करें।", unexpectedErrorNotes: "मेनू बनाते समय एक अप्रत्याशित त्रुटि हुई।", busyNotes: "एआई शेफ मेनू योजना बनाने में व्यस्त है! कृपया पुनः प्रयास करें।", busyTitle: "एआई व्यस्त", configErrorNotes: "एआई कॉन्फ़िगरेशन में कोई समस्या लगती है।", configErrorTitle: "कॉन्फ़िगरेशन त्रुटि", aiErrorGenericNotes: "एआई त्रुटि: {message}", aiErrorGenericTitle: "एआई त्रुटि", defaultFailTitle: "मेनू निर्माण विफल", defaultFailNotesInsufficient: "मेनू बनाने में विफल। सामग्री अपर्याप्त या अनुपयुक्त हो सकती है।", defaultSuccessNotes: "मेनू सफलतापूर्वक बनाया गया। विवरण के लिए कोर्स और शेफ के नोट्स की समीक्षा करें।" }
        },
        "bn": {
            noIngredients: { title: "ইনপুট ত্রুটি: কোনো উপকরণ নেই", notes: "অনুগ্রহ করে উপলব্ধ উপকরণ সরবরাহ করুন।" },
            noCourses: { title: "ইনপুট ত্রুটি: কোনো কোর্স নির্বাচন করা হয়নি", notes: "অনুগ্রহ করে মেনুর জন্য অন্তত একটি কোর্স নির্বাচন করুন।" },
            flowError: { aiErrorTitle: "এআই ত্রুটি: কোনো প্রতিক্রিয়া নেই", aiErrorNotes: "এআই শেফ একটি মেনু ফেরত দেয়নি। অনুগ্রহ করে আবার চেষ্টা করুন।", unexpectedErrorNotes: "মেনু তৈরি করার সময় একটি অপ্রত্যাশিত ত্রুটি ঘটেছে।", busyNotes: "এআই শেফ মেনু পরিকল্পনা করতে ব্যস্ত! অনুগ্রহ করে আবার চেষ্টা করুন।", busyTitle: "এআই ব্যস্ত", configErrorNotes: "এআই কনফিগারেশনে সমস্যা আছে বলে মনে হচ্ছে।", configErrorTitle: "কনফিগারেশন ত্রুটি", aiErrorGenericNotes: "এআই ত্রুটি: {message}", aiErrorGenericTitle: "এআই ত্রুটি", defaultFailTitle: "মেনু তৈরি ব্যর্থ হয়েছে", defaultFailNotesInsufficient: "মেনু তৈরি করা যায়নি। উপকরণ অপর্যাপ্ত বা অনুপযুক্ত হতে পারে।", defaultSuccessNotes: "মেনু সফলভাবে তৈরি হয়েছে। বিস্তারিত জানার জন্য কোর্স এবং শেফের নোট পর্যালোচনা করুন।" }
        },
        // Add more languages
    };
    // Use lowercase language code for lookup, default to 'en'
    return messages[lang.toLowerCase()] || messages["en"];
}
