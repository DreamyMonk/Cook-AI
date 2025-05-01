
'use client';
import React, { useState, useEffect, useTransition } from 'react';
import { type GenerateRecipeOutput } from '@/ai/flows/generate-recipe';
import { type GenerateProMenuOutput, type ProCourse } from '@/ai/flows/generate-pro-menu'; // Import Pro types
import { type RefineRecipeOutput } from '@/ai/flows/refine-recipe';
import { explainInstructions, type ExplainInstructionsInput } from '@/ai/flows/explain-instructions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Loader2, Sparkles, List, CookingPot, TriangleAlert, CheckSquare, Info, Lightbulb, Download, ChefHat, Soup, IceCream, Utensils, NotebookText } from 'lucide-react'; // Added NotebookText
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from "@/hooks/use-toast";
import type { TastePreference } from '@/app/page'; // Import TastePreference type

// --- Types ---
type StandardRecipe = GenerateRecipeOutput;
type RefinedRecipe = RefineRecipeOutput;
type ProMenu = GenerateProMenuOutput;

// Union type for the data to display
export type RecipeDisplayData =
    | { type: 'standard'; data: StandardRecipe }
    | { type: 'refined'; data: RefinedRecipe }
    | { type: 'pro-menu'; data: ProMenu };


// Supported languages mapping (Code to Name) - Used for AI flow calls
const supportedLanguagesMap = {
    "en": "English",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "hi": "Hindi",
    "bn": "Bengali",
    // Add more as needed
};
type LanguageCode = keyof typeof supportedLanguagesMap;

// UI Text translations (keyed by LanguageCode) - Add Pro Menu text
const uiText = {
    "en": {
        recipeNotePrefix: "Note:",
        ingredientsTitle: "Ingredients",
        ingredientsNotAvailable: "No ingredients listed.",
        mainIngredientsHeader: "**Main Ingredients (Provided):**", // Clarify source
        additionalIngredientsHeader: "**Additional Ingredients (Suggested):**", // Clarify source
        refinedIngredientsHeader: "**Refined Ingredients:**", // Header for refined list
        alternativeIdeasTitle: "Alternative Ideas",
        alternativeIdeasDescription: "These ingredients could also make other types of dishes. Click one to generate a different recipe:",
        tryAlternativeButton: "Try {type}",
        reviewAdditionalTitle: "Review Additional Items",
        reviewAdditionalDescription: "The chef suggested these extra items. Uncheck any you don't have, then click \"Refine Recipe\".",
        refinementInfoTitle: "Refinement Info",
        refineRecipeButton: "Refine Recipe",
        refiningButton: "Refining...",
        instructionsTitle: "Instructions",
        explainStepsButton: "Explain Steps",
        fetchingDetails: "Fetching Details...",
        explanationError: "Explanation Error",
        viewDetailedExplanation: "View Detailed Explanation",
        loadingExplanation: "Loading explanation...",
        errorTitle: "Error",
        noInstructionsToExplainTitle: "No Instructions",
        noInstructionsToExplainDesc: "There are no instructions available to explain.",
        explanationFailedTitle: "Explanation Failed",
        explanationFailedDesc: "Failed to get detailed instructions from the AI.",
        explanationErrorTitle: "Explanation Error",
        explanationErrorDesc: "Could not fetch detailed explanation: {errorMsg}",
        ingredientsUnavailable: "Ingredient details not available.",
        instructionsUnavailable: "Instructions unavailable.",
        notesUnavailable: "No specific notes provided.",
        ingredientsUnavailablePlaceholder: "Ingredient list unavailable.",
        instructionsUnavailablePlaceholder: "Instructions unavailable.",
        downloadRecipeButton: "Download Menu/Recipe (PDF)", // Updated text
        downloadingRecipe: "Downloading...",
        pdfGenerationErrorTitle: "PDF Error",
        pdfGenerationErrorDesc: "Could not generate the PDF. Please try again.",
        detailedExplanationTitle: "Detailed Explanation", // Added for PDF
        proMenuTitle: "Pro Chef Menu", // Pro menu specific text
        proMenuForGuests: "For {numGuests} Guests",
        proMenuCourseStarter: "Starter",
        proMenuCourseMain: "Main Course",
        proMenuCourseDessert: "Dessert",
        proMenuChefNotes: "Chef's Notes:",
        proMenuChefNotesPlaceholder: "No additional notes from the chef.",
    },
    "es": {
        recipeNotePrefix: "Nota:",
        ingredientsTitle: "Ingredientes",
        ingredientsNotAvailable: "No hay ingredientes listados.",
        mainIngredientsHeader: "**Ingredientes Principales (Proporcionados):**",
        additionalIngredientsHeader: "**Ingredientes Adicionales (Sugeridos):**",
        refinedIngredientsHeader: "**Ingredientes Refinados:**",
        alternativeIdeasTitle: "Ideas Alternativas",
        alternativeIdeasDescription: "Estos ingredientes también podrían usarse para otros tipos de platos. Haz clic en uno para generar una receta diferente:",
        tryAlternativeButton: "Probar {type}",
        reviewAdditionalTitle: "Revisar Artículos Adicionales",
        reviewAdditionalDescription: "El chef sugirió estos artículos extra. Desmarca los que no tengas y haz clic en \"Refinar Receta\".",
        refinementInfoTitle: "Información de Refinamiento",
        refineRecipeButton: "Refinar Receta",
        refiningButton: "Refinando...",
        instructionsTitle: "Instrucciones",
        explainStepsButton: "Explicar Pasos",
        fetchingDetails: "Obteniendo Detalles...",
        explanationError: "Error de Explicación",
        viewDetailedExplanation: "Ver Explicación Detallada",
        loadingExplanation: "Cargando explicación...",
        errorTitle: "Error",
        noInstructionsToExplainTitle: "Sin Instrucciones",
        noInstructionsToExplainDesc: "No hay instrucciones disponibles para explicar.",
        explanationFailedTitle: "Falló la Explicación",
        explanationFailedDesc: "No se pudieron obtener instrucciones detalladas de la IA.",
        explanationErrorTitle: "Error de Explicación",
        explanationErrorDesc: "No se pudo obtener la explicación detallada: {errorMsg}",
        ingredientsUnavailable: "Detalles de ingredientes no disponibles.",
        instructionsUnavailable: "Instrucciones no disponibles.",
        notesUnavailable: "No se proporcionaron notas específicas.",
        ingredientsUnavailablePlaceholder: "Lista de ingredientes no disponible.",
        instructionsUnavailablePlaceholder: "Instrucciones no disponibles.",
        downloadRecipeButton: "Descargar Menú/Receta (PDF)", // Updated text
        downloadingRecipe: "Descargando...",
        pdfGenerationErrorTitle: "Error PDF",
        pdfGenerationErrorDesc: "No se pudo generar el PDF. Por favor, inténtalo de nuevo.",
        detailedExplanationTitle: "Explicación Detallada",
        proMenuTitle: "Menú Chef Profesional",
        proMenuForGuests: "Para {numGuests} Invitados",
        proMenuCourseStarter: "Entrante",
        proMenuCourseMain: "Plato Principal",
        proMenuCourseDessert: "Postre",
        proMenuChefNotes: "Notas del Chef:",
        proMenuChefNotesPlaceholder: "No hay notas adicionales del chef.",
    },
    "fr": {
        recipeNotePrefix: "Note :",
        ingredientsTitle: "Ingrédients",
        ingredientsNotAvailable: "Aucun ingrédient listé.",
        mainIngredientsHeader: "**Ingrédients Principaux (Fournis) :**",
        additionalIngredientsHeader: "**Ingrédients Additionnels (Suggérés) :**",
        refinedIngredientsHeader: "**Ingrédients Affinés :**",
        alternativeIdeasTitle: "Idées Alternatives",
        alternativeIdeasDescription: "Ces ingrédients pourraient aussi servir à d'autres types de plats. Cliquez sur un pour générer une recette différente :",
        tryAlternativeButton: "Essayer {type}",
        reviewAdditionalTitle: "Vérifier les Articles Additionnels",
        reviewAdditionalDescription: "Le chef a suggéré ces articles supplémentaires. Décochez ceux que vous n'avez pas, puis cliquez sur \"Affiner la Recette\".",
        refinementInfoTitle: "Infos d'Affinage",
        refineRecipeButton: "Affiner la Recette",
        refiningButton: "Affinage...",
        instructionsTitle: "Instructions",
        explainStepsButton: "Expliquer les Étapes",
        fetchingDetails: "Récupération des Détails...",
        explanationError: "Erreur d'Explication",
        viewDetailedExplanation: "Voir l'Explication Détaillée",
        loadingExplanation: "Chargement de l'explication...",
        errorTitle: "Erreur",
        noInstructionsToExplainTitle: "Aucune Instruction",
        noInstructionsToExplainDesc: "Aucune instruction disponible à expliquer.",
        explanationFailedTitle: "Échec de l'Explication",
        explanationFailedDesc: "Impossible d'obtenir les instructions détaillées de l'IA.",
        explanationErrorTitle: "Erreur d'Explication",
        explanationErrorDesc: "Impossible de récupérer l'explication détaillée : {errorMsg}",
        ingredientsUnavailable: "Détails des ingrédients non disponibles.",
        instructionsUnavailable: "Instructions non disponibles.",
        notesUnavailable: "Aucune note spécifique fournie.",
        ingredientsUnavailablePlaceholder: "Liste d'ingrédients non disponible.",
        instructionsUnavailablePlaceholder: "Instructions non disponibles.",
        downloadRecipeButton: "Télécharger Menu/Recette (PDF)", // Updated text
        downloadingRecipe: "Téléchargement...",
        pdfGenerationErrorTitle: "Erreur PDF",
        pdfGenerationErrorDesc: "Impossible de générer le PDF. Veuillez réessayer.",
        detailedExplanationTitle: "Explication Détaillée",
        proMenuTitle: "Menu Chef Pro",
        proMenuForGuests: "Pour {numGuests} Invités",
        proMenuCourseStarter: "Entrée",
        proMenuCourseMain: "Plat Principal",
        proMenuCourseDessert: "Dessert",
        proMenuChefNotes: "Notes du Chef:",
        proMenuChefNotesPlaceholder: "Aucune note supplémentaire du chef.",
    },
    "de": {
        recipeNotePrefix: "Hinweis:",
        ingredientsTitle: "Zutaten",
        ingredientsNotAvailable: "Keine Zutaten aufgelistet.",
        mainIngredientsHeader: "**Hauptzutaten (Bereitgestellt):**",
        additionalIngredientsHeader: "**Zusätzliche Zutaten (Vorgeschlagen):**",
        refinedIngredientsHeader: "**Verfeinerte Zutaten:**",
        alternativeIdeasTitle: "Alternative Ideen",
        alternativeIdeasDescription: "Diese Zutaten könnten auch für andere Gerichte verwendet werden. Klicken Sie auf eines, um ein anderes Rezept zu generieren:",
        tryAlternativeButton: "{type} versuchen",
        reviewAdditionalTitle: "Zusätzliche Artikel überprüfen",
        reviewAdditionalDescription: "Der Koch hat diese zusätzlichen Artikel vorgeschlagen. Deaktivieren Sie alle, die Sie nicht haben, und klicken Sie dann auf „Rezept verfeinern“.",
        refinementInfoTitle: "Verfeinerungsinformationen",
        refineRecipeButton: "Rezept verfeinern",
        refiningButton: "Verfeinere...",
        instructionsTitle: "Anweisungen",
        explainStepsButton: "Schritte erklären",
        fetchingDetails: "Details abrufen...",
        explanationError: "Erklärungsfehler",
        viewDetailedExplanation: "Detaillierte Erklärung anzeigen",
        loadingExplanation: "Erklärung wird geladen...",
        errorTitle: "Fehler",
        noInstructionsToExplainTitle: "Keine Anweisungen",
        noInstructionsToExplainDesc: "Es sind keine Anweisungen zum Erklären verfügbar.",
        explanationFailedTitle: "Erklärung fehlgeschlagen",
        explanationFailedDesc: "Detaillierte Anweisungen konnten nicht von der KI abgerufen werden.",
        explanationErrorTitle: "Erklärungsfehler",
        explanationErrorDesc: "Detaillierte Erklärung konnte nicht abgerufen werden: {errorMsg}",
        ingredientsUnavailable: "Zutatendetails nicht verfügbar.",
        instructionsUnavailable: "Anweisungen nicht verfügbar.",
        notesUnavailable: "Keine spezifischen Hinweise bereitgestellt.",
        ingredientsUnavailablePlaceholder: "Zutatenliste nicht verfügbar.",
        instructionsUnavailablePlaceholder: "Anweisungen nicht verfügbar.",
        downloadRecipeButton: "Menü/Rezept herunterladen (PDF)", // Updated text
        downloadingRecipe: "Wird heruntergeladen...",
        pdfGenerationErrorTitle: "PDF-Fehler",
        pdfGenerationErrorDesc: "Das PDF konnte nicht generiert werden. Bitte versuchen Sie es erneut.",
        detailedExplanationTitle: "Detaillierte Erklärung",
        proMenuTitle: "Profi-Koch-Menü",
        proMenuForGuests: "Für {numGuests} Gäste",
        proMenuCourseStarter: "Vorspeise",
        proMenuCourseMain: "Hauptgericht",
        proMenuCourseDessert: "Dessert",
        proMenuChefNotes: "Anmerkungen des Kochs:",
        proMenuChefNotesPlaceholder: "Keine zusätzlichen Anmerkungen vom Koch.",
    },
    "hi": { // Hindi Translations
        recipeNotePrefix: "ध्यान दें:",
        ingredientsTitle: "सामग्री",
        ingredientsNotAvailable: "कोई सामग्री सूचीबद्ध नहीं है।",
        mainIngredientsHeader: "**मुख्य सामग्री (प्रदान की गई):**",
        additionalIngredientsHeader: "**अतिरिक्त सामग्री (सुझाई गई):**",
        refinedIngredientsHeader: "**परिष्कृत सामग्री:**",
        alternativeIdeasTitle: "वैकल्पिक विचार",
        alternativeIdeasDescription: "इन सामग्रियों से अन्य प्रकार के व्यंजन भी बन सकते हैं। एक अलग रेसिपी बनाने के लिए किसी एक पर क्लिक करें:",
        tryAlternativeButton: "{type} आज़माएँ",
        reviewAdditionalTitle: "अतिरिक्त सामग्री की समीक्षा करें",
        reviewAdditionalDescription: "शेफ ने इन अतिरिक्त वस्तुओं का सुझाव दिया है। जो आपके पास नहीं हैं उन्हें अनचेक करें, फिर \"रेसिपी परिष्कृत करें\" पर क्लिक करें।",
        refinementInfoTitle: "शोधन जानकारी",
        refineRecipeButton: "रेसिपी परिष्कृत करें",
        refiningButton: "परिष्कृत हो रहा है...",
        instructionsTitle: "निर्देश",
        explainStepsButton: "चरण समझाएं",
        fetchingDetails: "विवरण प्राप्त हो रहा है...",
        explanationError: "स्पष्टीकरण त्रुटि",
        viewDetailedExplanation: "विस्तृत स्पष्टीकरण देखें",
        loadingExplanation: "स्पष्टीकरण लोड हो रहा है...",
        errorTitle: "त्रुटि",
        noInstructionsToExplainTitle: "कोई निर्देश नहीं",
        noInstructionsToExplainDesc: "समझाने के लिए कोई निर्देश उपलब्ध नहीं हैं।",
        explanationFailedTitle: "स्पष्टीकरण विफल",
        explanationFailedDesc: "एआई से विस्तृत निर्देश प्राप्त करने में विफल।",
        explanationErrorTitle: "स्पष्टीकरण त्रुटि",
        explanationErrorDesc: "विस्तृत स्पष्टीकरण प्राप्त नहीं किया जा सका: {errorMsg}",
        ingredientsUnavailable: "सामग्री विवरण उपलब्ध नहीं हैं।",
        instructionsUnavailable: "निर्देश अनुपलब्ध।",
        notesUnavailable: "कोई विशिष्ट नोट प्रदान नहीं किया गया।",
        ingredientsUnavailablePlaceholder: "सामग्री सूची अनुपलब्ध।",
        instructionsUnavailablePlaceholder: "निर्देश अनुपलब्ध।",
        downloadRecipeButton: "मेनू/रेसिपी डाउनलोड करें (PDF)", // Updated text
        downloadingRecipe: "डाउनलोड हो रहा है...",
        pdfGenerationErrorTitle: "पीडीएफ त्रुटि",
        pdfGenerationErrorDesc: "पीडीएफ उत्पन्न नहीं किया जा सका। कृपया पुन: प्रयास करें।",
        detailedExplanationTitle: "विस्तृत स्पष्टीकरण",
        proMenuTitle: "प्रो शेफ मेनू",
        proMenuForGuests: "{numGuests} मेहमानों के लिए",
        proMenuCourseStarter: "स्टार्टर",
        proMenuCourseMain: "मुख्य कोर्स",
        proMenuCourseDessert: "मिठाई",
        proMenuChefNotes: "शेफ के नोट्स:",
        proMenuChefNotesPlaceholder: "शेफ से कोई अतिरिक्त नोट्स नहीं।",
    },
    "bn": { // Bengali Translations
        recipeNotePrefix: "দ্রষ্টব্য:",
        ingredientsTitle: "উপকরণ",
        ingredientsNotAvailable: "কোনো উপকরণ তালিকাভুক্ত নেই।",
        mainIngredientsHeader: "**প্রধান উপকরণ (প্রদান করা):**",
        additionalIngredientsHeader: "**অতিরিক্ত উপকরণ (প্রস্তাবিত):**",
        refinedIngredientsHeader: "**পরিমার্জিত উপকরণ:**",
        alternativeIdeasTitle: "বিকল্প ধারণা",
        alternativeIdeasDescription: "এই উপকরণগুলি দিয়ে অন্য ধরনের খাবারও তৈরি করা যেতে পারে। একটি ভিন্ন রেসিপি তৈরি করতে যেকোনো একটিতে ক্লিক করুন:",
        tryAlternativeButton: "{type} চেষ্টা করুন",
        reviewAdditionalTitle: "অতিরিক্ত আইটেম পর্যালোচনা করুন",
        reviewAdditionalDescription: "শেফ এই অতিরিক্ত আইটেমগুলির পরামর্শ দিয়েছেন। আপনার কাছে যা নেই তা আনচেক করুন, তারপর \"রেসিপি পরিমার্জন করুন\" ক্লিক করুন।",
        refinementInfoTitle: "পরিমার্জন তথ্য",
        refineRecipeButton: "রেসিপি পরিমার্জন করুন",
        refiningButton: "পরিমার্জন চলছে...",
        instructionsTitle: "নির্দেশাবলী",
        explainStepsButton: "ধাপগুলি ব্যাখ্যা করুন",
        fetchingDetails: "বিস্তারিত আনা হচ্ছে...",
        explanationError: "ব্যাখ্যা ত্রুটি",
        viewDetailedExplanation: "বিস্তারিত ব্যাখ্যা দেখুন",
        loadingExplanation: "ব্যাখ্যা লোড হচ্ছে...",
        errorTitle: "ত্রুটি",
        noInstructionsToExplainTitle: "কোনো নির্দেশাবলী নেই",
        noInstructionsToExplainDesc: "ব্যাখ্যা করার জন্য কোনো নির্দেশাবলী উপলব্ধ নেই।",
        explanationFailedTitle: "ব্যাখ্যা ব্যর্থ হয়েছে",
        explanationFailedDesc: "এআই থেকে বিস্তারিত নির্দেশাবলী পেতে ব্যর্থ হয়েছে।",
        explanationErrorTitle: "ব্যাখ্যা ত্রুটি",
        explanationErrorDesc: "বিস্তারিত ব্যাখ্যা আনা যায়নি: {errorMsg}",
        ingredientsUnavailable: "উপকরণ বিবরণ উপলব্ধ নেই।",
        instructionsUnavailable: "নির্দেশাবলী অনুপলব্ধ।",
        notesUnavailable: "কোনো নির্দিষ্ট নোট প্রদান করা হয়নি।",
        ingredientsUnavailablePlaceholder: "উপকরণ তালিকা অনুপলব্ধ।",
        instructionsUnavailablePlaceholder: "নির্দেশাবলী অনুপলব্ধ।",
        downloadRecipeButton: "মেনু/রেসিপি ডাউনলোড করুন (PDF)", // Updated text
        downloadingRecipe: "ডাউনলোড হচ্ছে...",
        pdfGenerationErrorTitle: "পিডিএফ ত্রুটি",
        pdfGenerationErrorDesc: "পিডিএফ তৈরি করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।",
        detailedExplanationTitle: "বিস্তারিত ব্যাখ্যা",
        proMenuTitle: "প্রো শেফ মেনু",
        proMenuForGuests: "{numGuests} অতিথিদের জন্য",
        proMenuCourseStarter: "স্টার্টার",
        proMenuCourseMain: "প্রধান কোর্স",
        proMenuCourseDessert: "ডেজার্ট",
        proMenuChefNotes: "শেফের নোট:",
        proMenuChefNotesPlaceholder: "শেফের কাছ থেকে কোনো অতিরিক্ত নোট নেই।",
    },
     // Add more languages as needed
};

interface RecipeDisplayProps {
  displayData: RecipeDisplayData; // Unified data prop
  alternativeTypes: string[] | null; // Only relevant for standard initial recipe
  onRefine: (unavailableAdditional: string[]) => void; // Only for standard recipe
  onSelectAlternative: (dishType: string) => void; // Only for standard recipe
  isRefining: boolean;
  isGenerating: boolean;
  language: LanguageCode;
  tastePreference?: TastePreference;
  showRefinementOptions: boolean; // Explicit prop to control refinement UI
}

interface AdditionalIngredientItem {
    id: string;
    name: string;
    available: boolean;
}

// Mapping course type to icon
const courseIcons: Record<ProCourse['type'], React.ElementType> = {
    starter: Soup,
    main: Utensils,
    dessert: IceCream,
};


export function RecipeDisplay({
    displayData,
    alternativeTypes,
    onRefine,
    onSelectAlternative,
    isRefining,
    isGenerating,
    language,
    tastePreference,
    showRefinementOptions, // Use this prop
}: RecipeDisplayProps) {
  const [additionalIngredientsChecklist, setAdditionalIngredientsChecklist] = useState<AdditionalIngredientItem[]>([]);
  const [refineError, setRefineError] = useState<string | null>(null);

  const [detailedInstructions, setDetailedInstructions] = useState<string | null>(null);
  const [isExplaining, startExplaining] = useTransition();
  const [explainError, setExplainError] = useState<string | null>(null);
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  const T = uiText[language] || uiText['en'];
  const languageName = supportedLanguagesMap[language] || 'English';


  useEffect(() => {
    // Reset explanation when data changes
    setDetailedInstructions(null);
    setExplainError(null);

    // Setup checklist ONLY if showRefinementOptions is true and it's a standard recipe
    if (showRefinementOptions && displayData.type === 'standard' && displayData.data.additionalIngredients && displayData.data.additionalIngredients.length > 0) {
      const initialItems = displayData.data.additionalIngredients.map((name, index) => ({
        id: `add-ing-${index}-${displayData.data.recipeName?.replace(/\s+/g, '-') || 'recipe'}-${Date.now()}`,
        name: name,
        available: true,
      }));
      setAdditionalIngredientsChecklist(initialItems);
      setRefineError(null);
    } else {
      setAdditionalIngredientsChecklist([]); // Clear checklist otherwise
    }

    // Clear refinement error if the main data changes
    setRefineError(null);

  }, [displayData, showRefinementOptions]); // Depend on displayData and showRefinementOptions

  const handleAvailabilityChange = (id: string, checked: boolean) => {
    setAdditionalIngredientsChecklist(prev =>
      prev.map(ing =>
        ing.id === id ? { ...ing, available: checked } : ing
      )
    );
     setRefineError(null);
  };

  const handleRefineClick = () => {
    if (!showRefinementOptions) return; // Guard against misuse
    setRefineError(null);
    const unavailable = additionalIngredientsChecklist
      .filter(ing => !ing.available)
      .map(ing => ing.name);
    onRefine(unavailable);
  };

   // Formats the ingredients for the INITIAL standard recipe display
   const formatInitialIngredientsList = (provided: string[] | undefined, additional: string[] | undefined): string => {
       if (!provided && !additional) return T.ingredientsNotAvailable;
       const providedItems = provided && provided.length > 0 ? provided : [];
       const additionalItems = additional && additional.length > 0 ? additional : [];
       let formattedString = "";
       if (providedItems.length > 0) {
           formattedString += T.mainIngredientsHeader + "\n" + providedItems.map(item => `- ${item}`).join('\n');
       }
       if (additionalItems.length > 0) {
           if(formattedString) formattedString += "\n\n";
           formattedString += T.additionalIngredientsHeader + "\n" + additionalItems.map(item => `- ${item}`).join('\n');
       }
        if (providedItems.length === 0 && additionalItems.length === 0) {
            formattedString = T.ingredientsUnavailable;
        }
       return formattedString;
   };

   // Helper function to render text content, handling markdown-like lists and paragraphs
   // Handles bolding (e.g., **Provided:**) and list items (- Item)
   const formatTextToComponent = (text: string | null | undefined, placeholder: string = T.instructionsUnavailablePlaceholder) => {
        if (!text) return <p className="text-muted-foreground italic text-base">{placeholder}</p>;

        const lines = text.split('\n').map(line => line.trim()); // Keep empty lines for spacing if intended

        if (lines.length === 0 || lines.every(line => line === '')) return <p className="text-muted-foreground italic text-base">{placeholder}</p>;

        return (
            <div className="space-y-1.5 text-muted-foreground text-base">
                {lines.map((line, index) => {
                    // Match **Bold Header:**
                    if (line.startsWith('**') && line.endsWith(':**')) {
                        return <p key={index} className="font-semibold text-foreground mt-3 mb-1">{line.slice(2, -3)}:</p>;
                    }
                    // Match - List Item or * List Item or 1. List Item
                    if (/^[-*]\s/.test(line)) {
                        return <p key={index} className="pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-accent">{line.slice(2)}</p>;
                    }
                     if (/^\d+[\.\)]\s/.test(line)) {
                         return <p key={index} className="pl-4 relative before:content-[attr(data-number)] before:absolute before:left-0 before:font-medium before:text-foreground/80" data-number={line.match(/^\d+[\.\)]/)?.[0]}>{line.replace(/^\d+[\.\)]\s/, '')}</p>;
                     }
                    // Match ## Subheading or # Heading
                    if (/^##+\s/.test(line)) {
                        const level = (line.match(/^#+/) || [''])[0].length;
                        const Tag = `h${Math.min(level + 2, 6)}` as keyof JSX.IntrinsicElements;
                        return <Tag key={index} className="font-semibold mt-4 mb-2 text-foreground">{line.replace(/^#+\s/, '')}</Tag>;
                    } else if (/^#\s/.test(line)) {
                         return <h2 key={index} className="text-lg font-semibold mt-5 mb-2 text-foreground">{line.replace(/^#\s/, '')}</h2>;
                     }
                    // Default paragraph
                    return <p key={index}>{line}</p>;
                })}
            </div>
        );
    };

    // Get ingredients and instructions based on the display data type
    let currentInstructions: string | undefined | null = null;
    let currentIngredients: string | undefined | null = null;
    let currentRecipeName: string | undefined | null = null;

    if (displayData.type === 'standard') {
        currentInstructions = displayData.data.instructions;
        currentIngredients = formatInitialIngredientsList(displayData.data.providedIngredients, displayData.data.additionalIngredients);
        currentRecipeName = displayData.data.recipeName;
    } else if (displayData.type === 'refined') {
        currentInstructions = displayData.data.refinedInstructions;
        // Refined ingredients are already formatted, just pass them through
        currentIngredients = displayData.data.refinedIngredients;
        currentRecipeName = displayData.data.refinedRecipeName;
    }
    // No single 'instructions' or 'ingredients' for pro-menu at top level

    // Check if instructions are meaningful for enabling the explain button (only for standard/refined)
    const instructionsAvailableForExplain = displayData.type !== 'pro-menu' &&
                                   currentInstructions &&
                                   currentInstructions.trim() !== T.instructionsUnavailable &&
                                   currentInstructions.trim() !== T.instructionsUnavailablePlaceholder &&
                                   currentInstructions.trim() !== "No instructions applicable.";


    const handleExplainInstructions = () => {
        if (!instructionsAvailableForExplain) {
            toast({ variant: "default", title: T.noInstructionsToExplainTitle, description: T.noInstructionsToExplainDesc });
            return;
        }
        setExplainError(null);
        setDetailedInstructions(null);

        // Ingredients list for context depends on whether it was refined
        const ingredientsForExplanation = displayData.type === 'refined'
            ? displayData.data.refinedIngredients // Already formatted string
            : (displayData.type === 'standard' ? formatInitialIngredientsList(displayData.data.providedIngredients, displayData.data.additionalIngredients) : ''); // Should not happen for pro

        const recipeNameForExplanation = displayData.type !== 'pro-menu' ? currentRecipeName || "Recipe" : "Recipe";

        const input: ExplainInstructionsInput = {
            recipeName: recipeNameForExplanation,
            originalInstructions: currentInstructions!, // Known to be available due to check
            ingredientsList: ingredientsForExplanation,
            language: languageName
        };

        startExplaining(async () => {
            try {
                const result = await explainInstructions(input);
                if (result && result.detailedExplanation && !result.detailedExplanation.startsWith("Error:")) {
                    setDetailedInstructions(result.detailedExplanation);
                } else {
                    const errorMsg = result?.detailedExplanation || T.explanationFailedDesc;
                    setExplainError(errorMsg);
                    toast({ variant: "destructive", title: T.explanationFailedTitle, description: errorMsg });
                }
            } catch (e) {
                console.error("Error explaining instructions:", e);
                const errorMsg = e instanceof Error ? e.message : T.explanationErrorDesc.replace('{errorMsg}', 'Unknown error');
                setExplainError(errorMsg);
                toast({ variant: "destructive", title: T.explanationErrorTitle, description: T.explanationErrorDesc.replace('{errorMsg}', errorMsg) });
            }
        });
    };

    // Function to generate and download PDF (updated for menu)
    const handleDownloadPdf = async () => {
        setIsDownloading(true);
        try {
            const { jsPDF } = await import('jspdf');
            const doc = new jsPDF({ unit: "pt", format: "a4" });

            const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
            const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();
            const margin = 40;
            const contentWidth = pageWidth - margin * 2;
            let currentY = margin;
            const lineHeight = 1.4;
            const titleFontSize = 20;
            const headingFontSize = 14;
            const subHeadingFontSize = 12;
            const bodyFontSize = 10;
            const smallFontSize = 8;

            // Helper function to add text and handle page breaks
            const addText = (text: string, options: any, size = bodyFontSize, spacing = 5) => {
                 doc.setFontSize(size);
                 const lines = doc.splitTextToSize(text || '', contentWidth); // Handle null/undefined text
                 lines.forEach((line: string) => {
                     if (currentY + size > pageHeight - margin) {
                         doc.addPage();
                         currentY = margin;
                         // Re-add border on new page
                         doc.setDrawColor(200, 200, 200);
                         doc.rect(margin / 2, margin / 2, pageWidth - margin, pageHeight - margin);
                     }
                     doc.text(line, margin, currentY, options);
                     currentY += size * lineHeight;
                 });
                 currentY += spacing;
            };

             // Add a border
            doc.setDrawColor(200, 200, 200);
            doc.rect(margin / 2, margin / 2, pageWidth - margin, pageHeight - margin);

            // --- PDF Content ---
            if (displayData.type === 'pro-menu') {
                const menuData = displayData.data;
                doc.setFont("helvetica", "bold");
                doc.setTextColor(40, 40, 40);
                addText(menuData.menuTitle || T.proMenuTitle, { align: "center" }, titleFontSize, 10);

                doc.setFont("helvetica", "normal");
                doc.setTextColor(100, 100, 100);
                addText(menuData.eventTheme || '', { align: "center" }, subHeadingFontSize, 5);
                addText(T.proMenuForGuests.replace('{numGuests}', String(menuData.numGuests)), { align: "center" }, subHeadingFontSize, 15);

                // Chef Notes first for pro menu
                if (menuData.chefNotes) {
                    doc.setFont("helvetica", "bold");
                    doc.setTextColor(60, 179, 113); // Primary-like color
                    addText(T.proMenuChefNotes, {}, headingFontSize, 8);
                    doc.setFont("helvetica", "normal");
                    doc.setTextColor(50, 50, 50);
                    addText(menuData.chefNotes, {}, bodyFontSize, 15);
                    doc.setLineWidth(0.5);
                    doc.setDrawColor(200, 200, 200);
                    doc.line(margin, currentY, pageWidth - margin, currentY);
                    currentY += 10;
                }


                // Loop through courses
                menuData.courses?.forEach(course => {

                    doc.setFont("helvetica", "bold");
                    doc.setTextColor(60, 179, 113); // Primary-like
                    const courseName = course.type === 'main' ? T.proMenuCourseMain : (course.type === 'starter' ? T.proMenuCourseStarter : T.proMenuCourseDessert);
                    addText(`${courseName}: ${course.recipeName}`, {}, headingFontSize, 8);

                     doc.setFont("helvetica", "bold"); // Make ingredient title bold
                     doc.setTextColor(80, 80, 80); // Slightly darker grey
                     addText(T.ingredientsTitle, {}, subHeadingFontSize, 5);
                     doc.setFont("helvetica", "normal"); // Reset font for list
                     doc.setTextColor(50, 50, 50);
                     const ingredientsContent = (course.ingredients || T.ingredientsUnavailable)
                         .replace(/\*\*(.*?)\*\*/g, '$1:') // Keep bold formatting for Provided/Additional
                         .replace(/^- /gm, '  • '); // Indent list items
                     addText(ingredientsContent, {}, bodyFontSize, 10);

                     doc.setFont("helvetica", "bold"); // Make instructions title bold
                     doc.setTextColor(80, 80, 80);
                     addText(T.instructionsTitle, {}, subHeadingFontSize, 5);
                     doc.setFont("helvetica", "normal"); // Reset font for steps
                     doc.setTextColor(50, 50, 50);
                     const instructionText = course.instructions || T.instructionsUnavailable;
                     const instructionLinesFormatted = instructionText.split('\n')
                         .map(l => l.trim())
                         .filter(Boolean)
                         .map(line => /^\d+[\.\)]\s/.test(line) ? line : (/^- /gm.test(line) ? "  • " + line.replace(/^- /gm, '') : line));
                     addText(instructionLinesFormatted.join('\n'), {}, bodyFontSize, 15);

                     // Add separator between courses
                     if (menuData.courses && menuData.courses.indexOf(course) < menuData.courses.length - 1) {
                        doc.setLineWidth(0.5);
                        doc.setDrawColor(200, 200, 200);
                        doc.line(margin, currentY, pageWidth - margin, currentY);
                        currentY += 10;
                     }
                });

            } else { // Standard or Refined Recipe
                const recipeData = displayData.data;
                const name = displayData.type === 'standard' ? recipeData.recipeName : recipeData.refinedRecipeName;
                const notes = displayData.type === 'standard' ? recipeData.notes : recipeData.feasibilityNotes;
                const ingredients = displayData.type === 'standard' ? formatInitialIngredientsList(recipeData.providedIngredients, recipeData.additionalIngredients) : recipeData.refinedIngredients;
                const instructions = displayData.type === 'standard' ? recipeData.instructions : recipeData.refinedInstructions;

                 doc.setFont("helvetica", "bold");
                 doc.setTextColor(40, 40, 40);
                 addText(name || "Recipe", { align: "center" }, titleFontSize, 15);

                 if (notes) {
                     doc.setFont("helvetica", "italic");
                     doc.setTextColor(100, 100, 100);
                     addText(`${T.recipeNotePrefix} ${notes}`, {}, smallFontSize, 10);
                 }

                 doc.setLineWidth(0.5);
                 doc.setDrawColor(200, 200, 200);
                 doc.line(margin, currentY, pageWidth - margin, currentY);
                 currentY += 10;

                 doc.setFont("helvetica", "bold");
                 doc.setTextColor(60, 179, 113);
                 addText(T.ingredientsTitle, {}, headingFontSize, 8);

                 doc.setFont("helvetica", "normal");
                 doc.setTextColor(50, 50, 50);
                 const ingredientsContent = (ingredients || T.ingredientsUnavailable)
                    .replace(/\*\*(.*?)\*\*/g, '$1:')
                    .replace(/^- /gm, '  • ');
                 addText(ingredientsContent, {}, bodyFontSize, 15);

                 doc.line(margin, currentY, pageWidth - margin, currentY);
                 currentY += 10;

                 doc.setFont("helvetica", "bold");
                 doc.setTextColor(60, 179, 113);
                 addText(T.instructionsTitle, {}, headingFontSize, 8);

                 doc.setFont("helvetica", "normal");
                 doc.setTextColor(50, 50, 50);
                 const instructionText = instructions || T.instructionsUnavailable;
                 const instructionLinesFormatted = instructionText.split('\n')
                      .map(l => l.trim())
                      .filter(Boolean)
                      .map(line => /^\d+[\.\)]\s/.test(line) ? line : (/^- /gm.test(line) ? "  • " + line.replace(/^- /gm, '') : line));
                 addText(instructionLinesFormatted.join('\n'), {}, bodyFontSize, 15);

                 // Add detailed explanation if available for standard/refined
                 if (detailedInstructions) {
                    doc.line(margin, currentY, pageWidth - margin, currentY);
                    currentY += 10;
                    doc.setFont("helvetica", "bold");
                    doc.setTextColor(60, 179, 113);
                    addText(T.detailedExplanationTitle, {}, headingFontSize, 8);
                    doc.setFont("helvetica", "normal");
                    doc.setTextColor(50, 50, 50);
                    const explanationText = detailedInstructions;
                    // Format explanation text similarly to instructions
                    const explanationLinesFormatted = explanationText.split('\n')
                        .map(l => l.trim()).filter(Boolean)
                        .map(line => {
                             if (/^\d+[\.\)]\s/.test(line)) return line; // Keep numbered list
                             if (/^- /gm.test(line)) return "  • " + line.replace(/^- /gm, ''); // Indent bullet points
                             if (/^\*\*([^*]+)\*\*/gm.test(line)) return "\n" + line.replace(/^\*\*([^*]+)\*\*/gm, '$1') + ":"; // Bold headers
                             return line;
                         });
                    addText(explanationLinesFormatted.join('\n'), {}, bodyFontSize, 15);
                 }
            }
            // --- End PDF Content ---

            const fileNameBase = (displayData.type === 'pro-menu' ? menuData.menuTitle : (displayData.type === 'standard' ? recipeData.recipeName : recipeData.refinedRecipeName)) || 'recipe_or_menu';
            const fileName = `${fileNameBase.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
            doc.save(fileName);

        } catch (error) {
            console.error("Error generating PDF:", error);
            toast({ variant: "destructive", title: T.pdfGenerationErrorTitle, description: T.pdfGenerationErrorDesc });
        } finally {
            setIsDownloading(false);
        }
    };

    // Show alternatives only if NOT refined and alternatives exist and NOT pro mode
    const showAlternatives = !detailedInstructions && displayData.type === 'standard' && alternativeTypes && alternativeTypes.length > 0;

    // Check if the recipe/menu is valid enough to be downloaded
    const canDownload = (displayData.type === 'standard' && !displayData.data.recipeName?.includes("Failed") && !displayData.data.recipeName?.includes("Error")) ||
                        (displayData.type === 'refined' && !displayData.data.refinedRecipeName?.includes("Failed") && !displayData.data.refinedRecipeName?.includes("Error")) ||
                        (displayData.type === 'pro-menu' && !displayData.data.menuTitle?.includes("Failed") && !displayData.data.menuTitle?.includes("Error"));


  return (
    <Card className="w-full border-none shadow-none bg-transparent flex flex-col h-full p-0">
       <ScrollArea className="flex-grow pr-3 -mr-3">
         <CardContent className="p-0 space-y-5 text-base">

            {/* --- Conditional Rendering based on displayData.type --- */}

            {/* Pro Menu Display */}
            {displayData.type === 'pro-menu' && (
                <div className="space-y-6">
                     {/* Chef Notes First */}
                     {displayData.data.chefNotes && (
                        <div className="border border-dashed border-accent/70 rounded-md p-4 bg-accent/10 dark:bg-accent/20">
                            <h3 className="font-semibold text-foreground/90 mb-2 flex items-center text-lg gap-2">
                                <NotebookText className="h-5 w-5 text-accent"/> {T.proMenuChefNotes}
                            </h3>
                            {formatTextToComponent(displayData.data.chefNotes, T.proMenuChefNotesPlaceholder)}
                        </div>
                     )}

                    {displayData.data.courses?.map((course, index) => {
                         const CourseIcon = courseIcons[course.type] || Utensils; // Default icon
                         const courseName = course.type === 'main' ? T.proMenuCourseMain : (course.type === 'starter' ? T.proMenuCourseStarter : T.proMenuCourseDessert);
                        return (
                            <div key={index} className="border-b border-border pb-5 last:border-b-0">
                                <h3 className="font-semibold text-foreground mb-2.5 flex items-center text-xl gap-2">
                                    <CourseIcon className="h-5 w-5 text-accent"/>
                                    {courseName}: {course.recipeName}
                                </h3>
                                <div className="pl-4 space-y-4">
                                    <div>
                                        <h4 className="font-medium text-foreground/90 mb-1.5 text-lg">{T.ingredientsTitle}</h4>
                                        {formatTextToComponent(course.ingredients, T.ingredientsUnavailablePlaceholder)}
                                    </div>
                                    <div>
                                         <h4 className="font-medium text-foreground/90 mb-1.5 text-lg">{T.instructionsTitle}</h4>
                                        {formatTextToComponent(course.instructions, T.instructionsUnavailablePlaceholder)}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {/* Download Button for Pro Menu */}
                    {canDownload && (
                        <div className="pt-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDownloadPdf}
                                disabled={isDownloading || isGenerating || isRefining || isExplaining}
                                className="border-primary text-primary hover:bg-primary/10 h-9 px-4 text-sm w-full"
                            >
                                {isDownloading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Download className="h-4 w-4 mr-1.5" />}
                                {isDownloading ? T.downloadingRecipe : T.downloadRecipeButton}
                            </Button>
                        </div>
                     )}
                </div>
            )}

            {/* Standard or Refined Recipe Display */}
            {(displayData.type === 'standard' || displayData.type === 'refined') && (
                <>
                    {/* Ingredients Section */}
                    <div>
                      <h3 className="font-semibold text-foreground mb-2.5 flex items-center text-lg">
                          <List className="h-5 w-5 mr-2 text-accent"/>
                          {displayData.type === 'refined' ? T.refinedIngredientsHeader : T.ingredientsTitle}
                      </h3>
                       {formatTextToComponent(currentIngredients, T.ingredientsUnavailablePlaceholder)}
                    </div>

                     {/* Alternative Dish Types Section (Only for standard initial) */}
                     {showAlternatives && (
                         <>
                         <Separator className="my-4"/>
                         <div className="space-y-3 rounded-md border border-dashed border-border p-4 bg-secondary/20">
                              <h3 className="font-semibold text-foreground flex items-center text-lg">
                                  <Lightbulb className="h-5 w-5 mr-2 text-accent"/> {T.alternativeIdeasTitle}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                  {T.alternativeIdeasDescription}
                              </p>
                              <div className="flex flex-wrap gap-2.5">
                                 {alternativeTypes.map((type) => (
                                    <Button
                                        key={type}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onSelectAlternative(type)}
                                        disabled={isGenerating || isRefining || isExplaining || isDownloading}
                                        className="border-primary text-primary hover:bg-primary/10 text-sm h-8 px-3"
                                        aria-live="polite"
                                    >
                                        {isGenerating ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                                        {T.tryAlternativeButton.replace('{type}', type)}
                                    </Button>
                                 ))}
                              </div>
                         </div>
                         </>
                     )}

                    {/* Refinement Checklist Section (Only if prop allows) */}
                    {showRefinementOptions && (
                        <>
                         <Separator className="my-4"/>
                         <div className="space-y-3 rounded-md border border-dashed border-border p-4 bg-secondary/20">
                             <h3 className="font-semibold text-foreground flex items-center text-lg">
                                 <CheckSquare className="h-5 w-5 mr-2 text-accent"/> {T.reviewAdditionalTitle}
                             </h3>
                             <p className="text-sm text-muted-foreground">
                                 {T.reviewAdditionalDescription}
                             </p>
                             <div className="space-y-2.5 max-h-40 overflow-y-auto pr-2">
                                {additionalIngredientsChecklist.map((ingredient) => (
                                <div key={ingredient.id} className="flex items-center space-x-3 p-1.5 rounded-md hover:bg-background/50">
                                    <Checkbox
                                    id={ingredient.id}
                                    checked={ingredient.available}
                                    onCheckedChange={(checked) => handleAvailabilityChange(ingredient.id, !!checked)}
                                    aria-labelledby={`${ingredient.id}-label`}
                                    disabled={isRefining || isExplaining || isGenerating || isDownloading}
                                    className="h-5 w-5"
                                    />
                                    <Label
                                    htmlFor={ingredient.id}
                                    id={`${ingredient.id}-label`}
                                    className={`flex-1 text-base font-medium cursor-pointer ${!ingredient.available ? 'text-muted-foreground line-through' : 'text-foreground'}`}
                                    >
                                    {ingredient.name}
                                    </Label>
                                </div>
                                ))}
                             </div>
                             {refineError && (
                                <Alert variant="destructive" className="mt-2 text-sm">
                                    <TriangleAlert className="h-4 w-4" />
                                    <AlertTitle className="text-sm font-medium">{T.refinementInfoTitle}</AlertTitle>
                                    <AlertDescription className="text-sm">{refineError}</AlertDescription>
                                </Alert>
                             )}
                             <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRefineClick}
                                disabled={isRefining || isExplaining || isGenerating || additionalIngredientsChecklist.length === 0 || isDownloading}
                                className="mt-3 border-primary text-primary hover:bg-primary/10 w-full sm:w-auto text-sm h-9 px-4 shadow-sm"
                                aria-live="polite"
                             >
                                {isRefining ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />{T.refiningButton}</>)
                                            : (<><Sparkles className="mr-2 h-4 w-4" />{T.refineRecipeButton}</>)}
                             </Button>
                         </div>
                        </>
                    )}

                    {/* Instructions Section */}
                    <Separator className="my-4"/>
                    <div>
                       <div className="flex justify-between items-center mb-2.5 flex-wrap gap-2">
                           <h3 className="font-semibold text-foreground flex items-center text-lg"><CookingPot className="h-5 w-5 mr-2 text-accent"/>{T.instructionsTitle}</h3>
                           <div className="flex items-center gap-2">
                                {/* Explain Button (Only for standard/refined) */}
                                {!detailedInstructions && instructionsAvailableForExplain && (
                                     <Button variant="ghost" size="sm" onClick={handleExplainInstructions} disabled={isExplaining || isRefining || isGenerating || isDownloading} className="text-primary hover:bg-primary/10 h-8 px-3 text-sm">
                                        {isExplaining ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Info className="h-4 w-4 mr-1.5" />}
                                         {T.explainStepsButton}
                                    </Button>
                                )}
                                {/* Download Button (Standard/Refined) */}
                                {canDownload && (
                                    <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={isDownloading || isGenerating || isRefining || isExplaining} className="border-primary text-primary hover:bg-primary/10 h-8 px-3 text-sm">
                                        {isDownloading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Download className="h-4 w-4 mr-1.5" />}
                                        {isDownloading ? T.downloadingRecipe : T.downloadRecipeButton}
                                    </Button>
                                )}
                           </div>
                       </div>
                       <div className="text-muted-foreground">
                         {formatTextToComponent(currentInstructions, T.instructionsUnavailablePlaceholder)}
                       </div>
                        {/* Explanation Accordion (Only for standard/refined) */}
                        {(isExplaining || explainError || detailedInstructions) && (
                             <Accordion type="single" collapsible className="w-full mt-5" defaultValue={detailedInstructions ? "item-1" : undefined}>
                                <AccordionItem value="item-1">
                                     <AccordionTrigger className={`text-primary hover:no-underline text-base py-2.5 ${detailedInstructions ? '' : 'cursor-default pointer-events-none'} [&[data-state=open]>svg]:text-primary`} disabled={!detailedInstructions || isExplaining || isDownloading}>
                                        {isExplaining ? (<span className="flex items-center"><Loader2 className="h-4 w-4 animate-spin mr-2" />{T.fetchingDetails}</span>)
                                                     : explainError ? (<span className="flex items-center text-destructive"><TriangleAlert className="h-4 w-4 mr-2" />{T.explanationError}</span>)
                                                     : (<span className="flex items-center"><Info className="h-4 w-4 mr-2" />{T.viewDetailedExplanation}</span>)}
                                     </AccordionTrigger>
                                    <AccordionContent className="pt-3 pb-1">
                                        {isExplaining ? (<div className="flex items-center text-muted-foreground p-4 text-base"><Loader2 className="h-5 w-5 animate-spin mr-2.5" /> {T.loadingExplanation}</div>)
                                                      : explainError ? (<Alert variant="destructive" className="text-sm my-2"><TriangleAlert className="h-4 w-4" /><AlertTitle className="text-sm font-medium">{T.errorTitle}</AlertTitle><AlertDescription className="text-sm">{explainError}</AlertDescription></Alert>)
                                                      : detailedInstructions ? (<div className="text-muted-foreground text-base">{formatTextToComponent(detailedInstructions)}</div>)
                                                      : null}
                                    </AccordionContent>
                                </AccordionItem>
                             </Accordion>
                        )}
                    </div>
                </>
            )}
             {/* --- End Conditional Rendering --- */}
         </CardContent>
       </ScrollArea>
    </Card>
  );
}
