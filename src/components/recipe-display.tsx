
'use client';
import React, { useState, useEffect, useTransition } from 'react';
import { type GenerateRecipeOutput } from '@/ai/flows/generate-recipe';
import { type RefineRecipeOutput } from '@/ai/flows/refine-recipe';
import { explainInstructions, type ExplainInstructionsInput } from '@/ai/flows/explain-instructions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Loader2, Sparkles, List, CookingPot, TriangleAlert, CheckSquare, Info, Lightbulb } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from "@/hooks/use-toast";
import type { TastePreference } from '@/app/page'; // Import TastePreference type

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

// UI Text translations (keyed by LanguageCode)
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
    },
     // Add more languages as needed
};

interface RecipeDisplayProps {
  recipe: GenerateRecipeOutput; // The originally generated recipe
  refinedRecipe: RefineRecipeOutput | null; // The result of refinement, if performed
  alternativeTypes: string[] | null;
  onRefine: (unavailableAdditional: string[]) => void;
  onSelectAlternative: (dishType: string) => void;
  isRefining: boolean;
  isGenerating: boolean;
  language: LanguageCode; // Expect language code (e.g., 'en', 'es')
  tastePreference?: TastePreference; // Add taste preference prop
}

interface AdditionalIngredientItem {
    id: string;
    name: string;
    available: boolean;
}

export function RecipeDisplay({
    recipe,
    refinedRecipe,
    alternativeTypes,
    onRefine,
    onSelectAlternative,
    isRefining,
    isGenerating,
    language, // Receive language code
    tastePreference // Receive taste preference
}: RecipeDisplayProps) {
  const [additionalIngredientsChecklist, setAdditionalIngredientsChecklist] = useState<AdditionalIngredientItem[]>([]);
  const [showRefineSection, setShowRefineSection] = useState(false);
  const [refineError, setRefineError] = useState<string | null>(null);

  const [detailedInstructions, setDetailedInstructions] = useState<string | null>(null);
  const [isExplaining, startExplaining] = useTransition();
  const [explainError, setExplainError] = useState<string | null>(null);
  const { toast } = useToast();

  // Get translated UI text based on language code
  const T = uiText[language] || uiText['en'];
  // Get the full language name for AI calls
  const languageName = supportedLanguagesMap[language] || 'English';


  useEffect(() => {
    // Reset explanation when recipe or refinement changes
    setDetailedInstructions(null);
    setExplainError(null);

    // Setup checklist based ONLY on the original recipe's additionalIngredients
    // This section should only appear if there's an original recipe and no refined recipe yet
    if (recipe && !refinedRecipe && recipe.additionalIngredients && recipe.additionalIngredients.length > 0) {
      const initialItems = recipe.additionalIngredients.map((name, index) => ({
        // Use a more robust key combination
        id: `add-ing-${index}-${recipe.recipeName?.replace(/\s+/g, '-') || 'recipe'}-${Date.now()}`,
        name: name,
        available: true, // Default to available
      }));
      setAdditionalIngredientsChecklist(initialItems);
      setShowRefineSection(true); // Show checklist if there are items
      setRefineError(null);
    } else {
      // Hide checklist if there's a refined recipe or no additional items initially
      setAdditionalIngredientsChecklist([]);
      setShowRefineSection(false);
    }

    // Clear refinement error if the base recipe changes or gets refined
    setRefineError(null);

  // Depend on recipe and refinedRecipe to re-evaluate checklist state
  }, [recipe, refinedRecipe]);

  const handleAvailabilityChange = (id: string, checked: boolean) => {
    setAdditionalIngredientsChecklist(prev =>
      prev.map(ing =>
        ing.id === id ? { ...ing, available: checked } : ing
      )
    );
     setRefineError(null); // Clear error when user interacts
  };

  const handleRefineClick = () => {
    setRefineError(null);
    // Filter based on the current checklist state
    const unavailable = additionalIngredientsChecklist
      .filter(ing => !ing.available)
      .map(ing => ing.name);

    onRefine(unavailable); // Pass only the names of unavailable items
  };

   // Formats the ingredients for the INITIAL recipe display
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
   const formatTextToComponent = (text: string | null | undefined) => {
        if (!text) return <p className="text-muted-foreground italic">{T.instructionsUnavailablePlaceholder}</p>;

        const lines = text.split('\n').map(line => line.trim()).filter(line => line !== '');

        if (lines.length === 0) return <p className="text-muted-foreground italic">{T.instructionsUnavailablePlaceholder}</p>;

        // Basic check for numbered lists (e.g., 1., 2))
        const isNumberedList = lines.length > 1 && lines.every(line => /^\d+[\.\)]\s/.test(line));
        // Basic check for markdown lists (e.g., -, *, +) or bold/headers
        const containsMarkdownFormatting = lines.some(line => /^\s*[-*+]\s/.test(line) || /^(#+|\*\*|__)/.test(line));

        if (isNumberedList) {
            return (
                <ol className="list-decimal list-outside space-y-1.5 pl-5 text-muted-foreground">
                {lines.map((line, index) => (
                    // Use index as key is acceptable here as list order is stable for display
                    <li key={index}>{line.replace(/^\d+[\.\)]\s/, '')}</li>
                ))}
                </ol>
            );
        } else if (containsMarkdownFormatting) {
             // Slightly simplified approach for markdown-like rendering
             // Using Tailwind's typography plugin (`prose`) can handle more complex markdown automatically
             // If not using `prose`, manual mapping is needed:
             return (
                 <div className="space-y-2 text-muted-foreground">
                    {lines.map((line, index) => {
                        if (/^\s*[-*+]\s/.test(line)) {
                            return <p key={index} className="pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-accent">{line.replace(/^\s*[-*+]\s/, '')}</p>;
                        } else if (/^##+\s/.test(line)) { // h3 and lower
                            const level = (line.match(/^#+/) || [''])[0].length;
                            const Tag = `h${Math.min(level + 2, 6)}` as keyof JSX.IntrinsicElements;
                            return <Tag key={index} className="font-semibold mt-3 mb-1 text-foreground">{line.replace(/^#+\s/, '')}</Tag>;
                        } else if (/^#\s/.test(line)) { // h2
                             return <h2 key={index} className="text-lg font-semibold mt-4 mb-1 text-foreground">{line.replace(/^#\s/, '')}</h2>;
                         }
                        else if (/^(\*\*|__)(.*?)\1/.test(line)) {
                            return <p key={index}><strong>{line.replace(/^(\*\*|__)(.*?)\1/, '$2')}</strong></p>;
                        }
                        return <p key={index}>{line}</p>;
                    })}
                 </div>
             );
        }

        // If no specific format detected, render as paragraphs
        return <div className="space-y-2 text-muted-foreground">{lines.map((line, index) => <p key={index}>{line}</p>)}</div>;
    };

    // Consolidate display data logic
    const displayData = refinedRecipe ? {
        name: refinedRecipe.refinedRecipeName,
        // Use the formatted string directly from refined output
        ingredientsText: refinedRecipe.refinedIngredients,
        instructionsText: refinedRecipe.refinedInstructions,
        notes: refinedRecipe.feasibilityNotes,
    } : {
        name: recipe.recipeName,
        // Format ingredients based on original structure
        ingredientsText: formatInitialIngredientsList(recipe.providedIngredients, recipe.additionalIngredients),
        instructionsText: recipe.instructions,
        notes: recipe.notes,
    };

    // Check if instructions are meaningful for enabling the explain button
    const instructionsAvailable = displayData.instructionsText &&
                                   displayData.instructionsText.trim() !== T.instructionsUnavailable &&
                                   displayData.instructionsText.trim() !== T.instructionsUnavailablePlaceholder &&
                                   displayData.instructionsText.trim() !== "No instructions applicable.";


    const handleExplainInstructions = () => {
        // Re-check instructions availability just before calling
        if (!instructionsAvailable) {
            toast({
                variant: "default",
                title: T.noInstructionsToExplainTitle,
                description: T.noInstructionsToExplainDesc,
            });
            return;
        }

        setExplainError(null);
        setDetailedInstructions(null);

        // Determine which ingredients list to send (refined if available, otherwise initial)
        const ingredientsForExplanation = refinedRecipe
            ? refinedRecipe.refinedIngredients // Use the refined list string
            : formatInitialIngredientsList(recipe.providedIngredients, recipe.additionalIngredients); // Use the formatted initial list

        const input: ExplainInstructionsInput = {
            recipeName: displayData.name || "Recipe",
            originalInstructions: displayData.instructionsText!, // Known to be available due to check above
            ingredientsList: ingredientsForExplanation,
            language: languageName // Pass the full language NAME
        };

        startExplaining(async () => {
            try {
                const result = await explainInstructions(input);
                if (result && result.detailedExplanation && !result.detailedExplanation.startsWith("Error:")) {
                    setDetailedInstructions(result.detailedExplanation);
                } else {
                    const errorMsg = result?.detailedExplanation || T.explanationFailedDesc;
                    setExplainError(errorMsg);
                    toast({
                        variant: "destructive",
                        title: T.explanationFailedTitle,
                        description: errorMsg,
                    });
                }
            } catch (e) {
                console.error("Error explaining instructions:", e);
                const errorMsg = e instanceof Error ? e.message : T.explanationErrorDesc.replace('{errorMsg}', 'Unknown error');
                setExplainError(errorMsg);
                toast({
                    variant: "destructive",
                    title: T.explanationErrorTitle,
                    description: T.explanationErrorDesc.replace('{errorMsg}', errorMsg),
                });
            }
        });
    };


    // Determine if refinement checklist or alternative types should be shown
    const showChecklist = showRefineSection; // Relies on state set in useEffect
    // Show alternatives only if NOT refined and alternatives exist
    const showAlternatives = !refinedRecipe && alternativeTypes && alternativeTypes.length > 0;


  return (
    <Card className="w-full border-none shadow-none bg-transparent flex flex-col h-full">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="text-xl font-semibold text-primary mb-1">{displayData.name}</CardTitle>
         {displayData.notes && (
            <CardDescription className="text-xs italic mt-1 text-muted-foreground">
                {T.recipeNotePrefix} {displayData.notes}
            </CardDescription>
         )}
      </CardHeader>

       <ScrollArea className="flex-grow pr-3 -mr-3"> {/* Offset scrollbar */}
         <CardContent className="p-0 space-y-4 text-sm">
            {/* Ingredients Section */}
            <div>
              <h3 className="font-semibold text-foreground mb-2 flex items-center">
                  <List className="h-4 w-4 mr-2 text-accent"/>
                  {/* Use specific header if refined */}
                  {refinedRecipe ? T.refinedIngredientsHeader : T.ingredientsTitle}
              </h3>
               {formatTextToComponent(displayData.ingredientsText)}
            </div>

             {/* Alternative Dish Types Section */}
             {showAlternatives && (
                 <>
                 <Separator className="my-3"/>
                 <div className="space-y-3 rounded-md border border-dashed border-border p-3 bg-secondary/20">
                      <h3 className="font-semibold text-foreground flex items-center text-base">
                          <Lightbulb className="h-5 w-5 mr-2 text-accent"/> {T.alternativeIdeasTitle}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                          {T.alternativeIdeasDescription}
                      </p>
                      <div className="flex flex-wrap gap-2">
                         {alternativeTypes.map((type) => (
                            <Button
                                key={type}
                                variant="outline"
                                size="sm"
                                onClick={() => onSelectAlternative(type)}
                                // Disable if any generation, refinement, or explanation is in progress
                                disabled={isGenerating || isRefining || isExplaining}
                                className="border-primary text-primary hover:bg-primary/10 text-xs h-7 px-2"
                                aria-live="polite"
                            >
                                {isGenerating ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                                {T.tryAlternativeButton.replace('{type}', type)}
                            </Button>
                         ))}
                      </div>
                 </div>
                 </>
             )}

            {/* Refinement Checklist Section */}
            {showChecklist && (
                <>
                 <Separator className="my-3"/>
                 <div className="space-y-3 rounded-md border border-dashed border-border p-3 bg-secondary/20">
                     <h3 className="font-semibold text-foreground flex items-center text-base">
                         <CheckSquare className="h-5 w-5 mr-2 text-accent"/> {T.reviewAdditionalTitle}
                     </h3>
                     <p className="text-xs text-muted-foreground">
                         {T.reviewAdditionalDescription}
                     </p>
                     <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                        {additionalIngredientsChecklist.map((ingredient) => (
                        <div key={ingredient.id} className="flex items-center space-x-3 p-1 rounded-md hover:bg-background/50">
                            <Checkbox
                            id={ingredient.id}
                            checked={ingredient.available}
                            onCheckedChange={(checked) =>
                                handleAvailabilityChange(ingredient.id, !!checked)
                            }
                            aria-labelledby={`${ingredient.id}-label`}
                            disabled={isRefining || isExplaining || isGenerating} // Disable if any action is happening
                            />
                            <Label
                            htmlFor={ingredient.id}
                            id={`${ingredient.id}-label`}
                            className={`flex-1 text-sm font-medium cursor-pointer ${!ingredient.available ? 'text-muted-foreground line-through' : 'text-foreground'}`}
                            >
                            {ingredient.name}
                            </Label>
                        </div>
                        ))}
                     </div>
                     {refineError && (
                        <Alert variant="destructive" className="mt-2 text-xs">
                            <TriangleAlert className="h-3 w-3" />
                            <AlertTitle className="text-xs font-medium">{T.refinementInfoTitle}</AlertTitle>
                            <AlertDescription className="text-xs">{refineError}</AlertDescription>
                        </Alert>
                     )}
                     <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefineClick}
                        disabled={isRefining || isExplaining || isGenerating || additionalIngredientsChecklist.length === 0} // Disable if no items
                        className="mt-2 border-primary text-primary hover:bg-primary/10 w-full sm:w-auto"
                        aria-live="polite"
                     >
                        {isRefining ? (
                            <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {T.refiningButton}
                            </>
                        ) : (
                            <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            {T.refineRecipeButton}
                            </>
                        )}
                     </Button>
                 </div>
                </>
            )}

            {/* Instructions Section */}
            <Separator className="my-3"/>
            <div>
               <div className="flex justify-between items-center mb-2">
                   <h3 className="font-semibold text-foreground flex items-center"><CookingPot className="h-4 w-4 mr-2 text-accent"/>{T.instructionsTitle}</h3>
                    {/* Show explain button only if instructions are available and not currently explaining/loading */}
                    {!detailedInstructions && instructionsAvailable && (
                         <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleExplainInstructions}
                            disabled={isExplaining || isRefining || isGenerating} // Disable if any action happening
                            className="text-primary hover:bg-primary/10 h-7 px-2"
                        >
                            {isExplaining ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                                <Info className="h-4 w-4 mr-1" />
                            )}
                             {T.explainStepsButton}
                        </Button>
                    )}
               </div>

               <div className="text-muted-foreground">
                 {formatTextToComponent(displayData.instructionsText)}
               </div>

                {/* Explanation Accordion */}
                {(isExplaining || explainError || detailedInstructions) && (
                     <Accordion type="single" collapsible className="w-full mt-4" defaultValue={detailedInstructions ? "item-1" : undefined}>
                        <AccordionItem value="item-1">
                             <AccordionTrigger
                                className={`text-primary hover:no-underline text-sm py-2 ${detailedInstructions ? '' : 'cursor-default pointer-events-none'}`} // Prevent click when no content yet
                                disabled={!detailedInstructions || isExplaining} // Disable trigger if no details or loading
                             >
                                {isExplaining ? (
                                    <span className="flex items-center"><Loader2 className="h-4 w-4 animate-spin mr-2" />{T.fetchingDetails}</span>
                                ) : explainError ? (
                                    <span className="flex items-center text-destructive"><TriangleAlert className="h-4 w-4 mr-2" />{T.explanationError}</span>
                                ) : (
                                     <span className="flex items-center"><Info className="h-4 w-4 mr-2" />{T.viewDetailedExplanation}</span>
                                )}
                             </AccordionTrigger>
                            <AccordionContent className="pt-2 pb-0">
                                {isExplaining ? (
                                    <div className="flex items-center text-muted-foreground p-4">
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" /> {T.loadingExplanation}
                                    </div>
                                ) : explainError ? (
                                    <Alert variant="destructive" className="text-xs my-2">
                                        <TriangleAlert className="h-3 w-3" />
                                        <AlertTitle className="text-xs font-medium">{T.errorTitle}</AlertTitle>
                                        <AlertDescription className="text-xs">{explainError}</AlertDescription>
                                    </Alert>
                                ) : detailedInstructions ? (
                                     <div className="text-muted-foreground">
                                        {formatTextToComponent(detailedInstructions)}
                                    </div>
                                ) : null /* Should not happen if trigger is disabled properly */}
                            </AccordionContent>
                        </AccordionItem>
                     </Accordion>
                )}

            </div>

         </CardContent>
       </ScrollArea>
    </Card>
  );
}
