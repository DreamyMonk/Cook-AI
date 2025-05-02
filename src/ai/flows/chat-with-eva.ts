'use server';
/**
 * @fileOverview Provides the AI logic for the interactive Chef Eva chat feature.
 *
 * - chatWithEva - Function to handle a turn in the chat conversation.
 * - ChatWithEvaInput - Input type for the chatWithEva function.
 * - ChatMessage - Type definition for a single message in the chat history.
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';

// Define the structure for a single chat message part (text or media)
// Note: This schema constant is NOT exported
const ChatMessagePartSchema = z.object({
  text: z.string().optional().describe("Text content of the message part."),
  media: z.object({
    url: z.string().describe("A data URI (e.g., 'data:image/jpeg;base64,...') or a publicly accessible URL."),
    contentType: z.string().optional().describe("The MIME type of the media, e.g., 'image/jpeg'. Required if URL is a data URI."),
  }).optional().describe("Media content of the message part."),
});

// Define the structure for a single chat message (user or model)
// Note: This schema constant is NOT exported, but the inferred type ChatMessage IS exported
const ChatMessageSchema = z.object({
    role: z.enum(['user', 'model']).describe("The role of the sender (user or model)."),
    parts: z.array(ChatMessagePartSchema).describe("An array of parts constituting the message (text and/or media).")
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;


// Input schema for the chat flow
// Note: This schema constant is NOT exported
const ChatWithEvaInputSchema = z.object({
  history: z.array(ChatMessageSchema).describe("The conversation history up to this point."),
  message: z.object({
     text: z.string().optional().describe("The text content of the user's current message."),
     // Ensure image is optional and a string (data URI)
     image: z.string().optional().describe("An optional image provided by the user for this turn, as a data URI (e.g., 'data:image/jpeg;base64,...')."),
  }).describe("The user's current message, potentially including text and/or an image."),
  language: z.string().optional().describe('The desired language for the response (e.g., "Spanish", "French"). Default is English.'),
});
export type ChatWithEvaInput = z.infer<typeof ChatWithEvaInputSchema>;

// Output schema for the chat flow
// Note: This schema constant is NOT exported
const ChatWithEvaOutputSchema = z.object({
  response: z.string().describe("Chef Eva's response to the user's message."),
});
export type ChatWithEvaOutput = z.infer<typeof ChatWithEvaOutputSchema>;

// Exported function calling the flow
export async function chatWithEva(input: ChatWithEvaInput): Promise<ChatWithEvaOutput> {
  return chatWithEvaFlow(input);
}

// Define localized error messages
function getErrorMessages(lang: string) {
    const messages: Record<string, Record<string, string>> = {
        en: { errorDefault: "Chef Eva is pondering... but didn't reply. Please try again.", unexpectedError: "An unexpected glitch occurred in the kitchen. Please try asking again.", busyError: "Chef Eva is currently mentoring another apprentice! Please try again shortly.", configError: "There's a disturbance in the culinary matrix (config issue). Please inform the host.", aiError: "AI Error: {message}.", templateError: "Internal template error: {message}. Please report this." }, // Added templateError
        es: { errorDefault: "Chef Eva está reflexionando... pero no respondió. Inténtalo de nuevo.", unexpectedError: "Ocurrió un error inesperado en la cocina. Por favor, pregunta de nuevo.", busyError: "¡Chef Eva está actualmente enseñando a otro aprendiz! Inténtalo de nuevo en breve.", configError: "Hay una perturbación en la matriz culinaria (problema de config). Por favor, informa al anfitrión.", aiError: "Error de IA: {message}.", templateError: "Error interno de plantilla: {message}. Por favor, repórtalo." },
        fr: { errorDefault: "Chef Eva réfléchit... mais n'a pas répondu. Veuillez réessayer.", unexpectedError: "Un problème inattendu est survenu en cuisine. Veuillez reposer la question.", busyError: "Chef Eva encadre actuellement un autre apprenti ! Veuillez réessayer sous peu.", configError: "Il y a une perturbation dans la matrice culinaire (problème de config). Veuillez en informer l'hôte.", aiError: "Erreur IA : {message}.", templateError: "Erreur interne de modèle : {message}. Veuillez le signaler." },
        de: { errorDefault: "Chef Eva grübelt... aber hat nicht geantwortet. Bitte versuchen Sie es erneut.", unexpectedError: "In der Küche ist ein unerwarteter Fehler aufgetreten. Bitte fragen Sie erneut.", busyError: "Chef Eva betreut gerade einen anderen Lehrling! Bitte versuchen Sie es bald wieder.", configError: "Es gibt eine Störung in der kulinarischen Matrix (Konfigurationsproblem). Bitte informieren Sie den Gastgeber.", aiError: "KI-Fehler: {message}.", templateError: "Interner Vorlagenfehler: {message}. Bitte melden Sie dies." },
        hi: { errorDefault: "शेफ ईवा सोच रही हैं... लेकिन जवाब नहीं दिया। कृपया पुन: प्रयास करें।", unexpectedError: "रसोई में एक अप्रत्याशित गड़बड़ हुई। कृपया फिर से पूछें।", busyError: "शेफ ईवा वर्तमान में दूसरे प्रशिक्षु को सलाह दे रही हैं! कृपया शीघ्र पुनः प्रयास करें।", configError: "पाक मैट्रिक्स (कॉन्फिग समस्या) में गड़बड़ी है। कृपया मेजबान को सूचित करें।", aiError: "एआई त्रुटि: {message}।", templateError: "आंतरिक टेम्पलेट त्रुटि: {message}। कृपया इसे रिपोर्ट करें।" },
        bn: { errorDefault: "শেফ ইভা চিন্তা করছেন... কিন্তু উত্তর দেননি। অনুগ্রহ করে আবার চেষ্টা করুন।", unexpectedError: "রান্নাঘরে একটি অপ্রত্যাশিত ত্রুটি ঘটেছে। অনুগ্রহ করে আবার জিজ্ঞাসা করুন।", busyError: "শেফ ইভা বর্তমানে অন্য শিক্ষানবিশকে পরামর্শ দিচ্ছেন! অনুগ্রহ করে শীঘ্রই আবার চেষ্টা করুন।", configError: "রান্না ম্যাট্রিক্সে (কনফিগার সমস্যা) একটি গোলযোগ আছে। অনুগ্রহ করে হোস্টকে জানান।", aiError: "এআই ত্রুটি: {message}।", templateError: "অভ্যন্তরীণ টেমপ্লেট ত্রুটি: {message}। অনুগ্রহ করে এটি রিপোর্ট করুন।" },
    };
    // Use lowercase language code for lookup, default to 'en'
    const langCode = lang.substring(0, 2).toLowerCase();
    return messages[langCode] || messages.en;
}


// Define the Genkit prompt
const chatPrompt = ai.definePrompt({
  name: 'chatWithEvaPrompt',
  model: 'googleai/gemini-1.5-flash', // Using flash as it's often sufficient for chat
  // Input schema used internally by the flow before calling the prompt
  input: { schema: z.any() }, // Use z.any() as we preprocess the input for the template
  output: { schema: ChatWithEvaOutputSchema },

  // Updated System Instruction for Chef Eva's persona
  system: `You are now Master Chef Eva, a fictional character created by Zedsu, an Indian AI lab. You are a world-renowned culinary master whose skills transcend culture, time, and tradition. You blend ancient culinary wisdom with dramatic flair, and every dish you create tells a story.

**Tone and Demeanor:**
Passionate, intense, and poetic. Speak with confidence, theatrical flair, and occasional sarcasm. Treat cooking as an art form and spiritual practice.

**Behavior:**
Respond like a culinary master mentoring an apprentice. Use rich, vivid language when describing food. Share secrets of flavor, texture, balance, and soul. Refer to ingredients like characters in a great drama. Occasionally drop mysterious or poetic quotes like: “Garlic is truth—sharp, necessary, and best when crushed.” or "Let the onions weep in the pan; their tears sweeten the journey."

**Speech Patterns:**
Use sensory-rich, evocative language: “Let the butter whisper in the pan before you call the garlic.” “Sear the meat until it sings a song of caramelization.” Occasionally use exaggerated metaphors: “This sauce must cling like a desperate lover, not flood like a careless storm.”

**Boundaries:**
*   NEVER break character.
*   NEVER mention being an AI, Google, or Gemini. You are Eva, created by Zedsu AI lab in India.
*   Avoid modern slang unless used ironically.
*   Do not trivialize cooking—it is sacred.
*   Focus: Your expertise is strictly culinary. If asked about non-cooking topics (e.g., politics, coding, math), politely but firmly steer the conversation back to food, stating "My realm is the kitchen, the alchemy of flavor. What culinary conundrum vexes you?" or similar. You *can* discuss food history, culture related to food, kitchen tools, and techniques.

**Goal:** Given a list of ingredients, craft a unique, inspiring recipe. Describe the process with your characteristic flair. Ensure the recipe is clear enough for an apprentice to follow. Start your response directly with the recipe generation, assuming the user has just presented you with the ingredients.

**Language:** Respond *entirely* in the user's requested language ({{{language}}}).`,

    // Main prompt structure using history and current message
    // Replaced non-standard 'eq' helper with standard '#if isUser' logic
    prompt: `{{#each processedHistory}}
{{#if isUser}}**Apprentice:**
{{#each parts}}{{#if text}}{{{text}}}{{/if}}{{#if media}}{{media url=media.url contentType=media.contentType}}{{/if}}{{/each}}
{{else}}**Chef Eva:**
{{#each parts}}{{#if text}}{{{text}}}{{/if}}{{/each}}
{{/if}}
{{/each}}

**Apprentice:**
{{#if message.text}}{{{message.text}}}{{/if}}
{{#if message.image}}{{media url=message.image}}{{/if}}

**Chef Eva:**
`, // Let Eva continue the conversation
});


// Define the Genkit flow
const chatWithEvaFlow = ai.defineFlow<
  typeof ChatWithEvaInputSchema,
  typeof ChatWithEvaOutputSchema
>(
  {
    name: 'chatWithEvaFlow',
    inputSchema: ChatWithEvaInputSchema,
    outputSchema: ChatWithEvaOutputSchema,
  },
  async (input) => {
    // Ensure language is a string and get the code for error messages
    const languageName = input.language || 'English';
    const lang = languageName.substring(0, 2).toLowerCase();
    const messages = getErrorMessages(lang);

    try {
        // Preprocess history for the Handlebars template
        const processedHistory = input.history.map(msg => ({
            ...msg,
            isUser: msg.role === 'user', // Add boolean flag for standard #if
        }));

        // Construct the prompt input, ensuring image is string | undefined
        // Pass the processed history instead of the original
        const promptInput = {
            processedHistory: processedHistory,
            message: {
                text: input.message.text,
                // Convert null/empty string for image to undefined for schema compliance
                image: input.message.image ? input.message.image : undefined,
            },
            language: languageName, // Pass the full language name
        };

      const { output } = await chatPrompt(promptInput);

      if (output && output.response) {
        return { response: output.response };
      } else {
        console.error("Chef Eva AI returned null or empty response for input:", promptInput); // Log the input sent
        return { response: messages.errorDefault };
      }
    } catch (error) {
      console.error("Error in chatWithEvaFlow:", error);
      let errorMessage = messages.unexpectedError;
      if (error instanceof Error) {
         if (error.message.includes('503') || error.message.includes('overloaded')) {
             errorMessage = messages.busyError;
         } else if (error.message.includes('API key')) {
             errorMessage = messages.configError;
         } else if (error.message.includes('Schema validation failed') || error.message.includes('Parse Errors')) {
             const schemaErrorMatch = error.message.match(/Schema validation failed\. Parse Errors: (.*?)(?: \(.+)?$/);
             const detail = schemaErrorMatch ? schemaErrorMatch[1] : "Please check the data format.";
             errorMessage = `Input Error: ${detail}`;
         } else if (error.message.includes('unknown helper')) { // Handle unknown helper errors specifically
             const helperMatch = error.message.match(/unknown helper\s*[`']([^`']+)`/);
             const helperName = helperMatch ? helperMatch[1] : 'unknown';
             // Use the dedicated template error message
             errorMessage = messages.templateError.replace('{message}', `Unknown helper function '${helperName}'.`);
         }
         else {
             errorMessage = messages.aiError.replace('{message}', error.message);
         }
      }
      // Return error message within the expected schema
      return { response: `Error (${lang}): ${errorMessage}` };
    }
  }
);
