
'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { IngredientForm } from '@/components/ingredient-form';
import { RecipeDisplay } from '@/components/recipe-display';
import { generateRecipe, type GenerateRecipeOutput } from '@/ai/flows/generate-recipe';
import { refineRecipe, type RefineRecipeInput, type RefineRecipeOutput } from '@/ai/flows/refine-recipe';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, UtensilsCrossed, TriangleAlert, Languages } from 'lucide-react'; // Added Languages icon
import Image from 'next/image';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"


// State for the main recipe generation result
type RecipeState = GenerateRecipeOutput | null;
// State for the refined recipe result
type RefinedRecipeState = RefineRecipeOutput | null;

// Supported languages mapping (Code to Name)
const supportedLanguages = {
    "en": "English",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "hi": "Hindi",     // Added Hindi
    "bn": "Bengali",   // Added Bengali
    // Add more as needed
};
type LanguageCode = keyof typeof supportedLanguages;

// Supported Taste Preferences
export const supportedTastePreferences = [
    "Any", // Default
    "Indian",
    "Chinese",
    "Japanese",
    "Thai",
    "Mediterranean",
    "Italian",
    "Mexican",
    "American",
    "French", // Added French cuisine
    "Middle Eastern", // Added Middle Eastern
    "Korean", // Added Korean
];
export type TastePreference = typeof supportedTastePreferences[number];


// UI Text translations (keyed by LanguageCode)
const uiText = {
    "en": {
        title: "FridgeChef",
        tagline: "Tell us what's in your fridge, and we'll whip up a recipe for you!",
        ingredientsTitle: "Your Ingredients",
        ingredientsDescription: "Enter ingredients, select language, and optionally choose a taste preference.",
        recipeTitle: "Suggested Recipe",
        recipeDescriptionGenerated: "Generated based on your ingredients.",
        recipeDescriptionRefined: "Refined recipe based on your feedback.",
        recipeDescriptionPlaceholder: "Your generated recipe will appear here.",
        generatingAltText: "Generating your delicious recipe...",
        refiningAltText: "Refining the recipe...",
        loadingPlaceholder: "Please wait while the chef is thinking...",
        errorPlaceholder: "There was an issue generating or refining the recipe.",
        errorTitle: "Error",
        footerText: "FridgeChef. Powered by AI.",
        selectLanguagePlaceholder: "Select Language",
        selectTastePlaceholder: "Taste Preference (Optional)",
        inputErrorNoIngredients: "No ingredients provided. Please list the ingredients you have.",
        generateFailedGeneric: "Could not generate a recipe. The AI might be unavailable or the request failed unexpectedly.",
        generateFailedInsufficient: "Could not generate a recipe. The provided ingredients may be insufficient or mismatched for a complete dish.",
        refineFailedGeneric: "Could not refine the recipe. The AI might be unavailable or the request failed unexpectedly.",
        refineErrorNoRecipe: "Cannot refine recipe - no initial recipe generated.",
        refineErrorGeneric: "An unexpected error occurred during refinement: {message}. Please try again later.",
        refineErrorUnknown: "An unexpected error occurred while refining the recipe. Please try again later.",
        generateErrorGeneric: "An unexpected error occurred: {message}. Please try again later.",
        generateErrorUnknown: "An unexpected error occurred while generating the recipe. Please try again later.",
        generateAltErrorMissingIngredients: "Cannot generate alternative - original ingredients list is missing.",
    },
    "es": {
        title: "ChefDeNevera",
        tagline: "¡Dinos qué hay en tu nevera y te prepararemos una receta!",
        ingredientsTitle: "Tus Ingredientes",
        ingredientsDescription: "Ingresa ingredientes, selecciona idioma y opcionalmente elige una preferencia de sabor.",
        recipeTitle: "Receta Sugerida",
        recipeDescriptionGenerated: "Generada según tus ingredientes.",
        recipeDescriptionRefined: "Receta refinada basada en tus comentarios.",
        recipeDescriptionPlaceholder: "Tu receta generada aparecerá aquí.",
        generatingAltText: "Generando tu deliciosa receta...",
        refiningAltText: "Refinando la receta...",
        loadingPlaceholder: "Por favor espera mientras el chef piensa...",
        errorPlaceholder: "Hubo un problema al generar o refinar la receta.",
        errorTitle: "Error",
        footerText: "ChefDeNevera. Impulsado por IA.",
        selectLanguagePlaceholder: "Seleccionar Idioma",
        selectTastePlaceholder: "Preferencia de Sabor (Opcional)",
        inputErrorNoIngredients: "No se proporcionaron ingredientes. Por favor, enumera los ingredientes que tienes.",
        generateFailedGeneric: "No se pudo generar una receta. La IA podría no estar disponible o la solicitud falló inesperadamente.",
        generateFailedInsufficient: "No se pudo generar una receta. Los ingredientes proporcionados pueden ser insuficientes o incompatibles para un plato completo.",
        refineFailedGeneric: "No se pudo refinar la receta. La IA podría no estar disponible o la solicitud falló inesperadamente.",
        refineErrorNoRecipe: "No se puede refinar la receta - no se generó ninguna receta inicial.",
        refineErrorGeneric: "Ocurrió un error inesperado durante el refinamiento: {message}. Por favor, inténtalo de nuevo más tarde.",
        refineErrorUnknown: "Ocurrió un error inesperado al refinar la receta. Por favor, inténtalo de nuevo más tarde.",
        generateErrorGeneric: "Ocurrió un error inesperado: {message}. Por favor, inténtalo de nuevo más tarde.",
        generateErrorUnknown: "Ocurrió un error inesperado al generar la receta. Por favor, inténtalo de nuevo más tarde.",
        generateAltErrorMissingIngredients: "No se puede generar alternativa - falta la lista original de ingredientes.",
    },
    "fr": {
        title: "ChefDuFrigo",
        tagline: "Dites-nous ce qu'il y a dans votre frigo et nous vous concocterons une recette !",
        ingredientsTitle: "Vos Ingrédients",
        ingredientsDescription: "Entrez les ingrédients, sélectionnez la langue et choisissez éventuellement une préférence gustative.",
        recipeTitle: "Recette Suggérée",
        recipeDescriptionGenerated: "Générée à partir de vos ingrédients.",
        recipeDescriptionRefined: "Recette affinée suite à vos commentaires.",
        recipeDescriptionPlaceholder: "Votre recette générée apparaîtra ici.",
        generatingAltText: "Génération de votre délicieuse recette...",
        refiningAltText: "Affinement de la recette...",
        loadingPlaceholder: "Veuillez patienter pendant que le chef réfléchit...",
        errorPlaceholder: "Un problème est survenu lors de la génération ou de l'affinage de la recette.",
        errorTitle: "Erreur",
        footerText: "ChefDuFrigo. Propulsé par l'IA.",
        selectLanguagePlaceholder: "Choisir la Langue",
        selectTastePlaceholder: "Préférence Gustative (Facultatif)",
        inputErrorNoIngredients: "Aucun ingrédient fourni. Veuillez lister les ingrédients dont vous disposez.",
        generateFailedGeneric: "Impossible de générer une recette. L'IA est peut-être indisponible ou la requête a échoué.",
        generateFailedInsufficient: "Impossible de générer une recette. Les ingrédients fournis peuvent être insuffisants ou incompatibles pour un plat complet.",
        refineFailedGeneric: "Impossible d'affiner la recette. L'IA est peut-être indisponible ou la requête a échoué.",
        refineErrorNoRecipe: "Impossible d'affiner la recette - aucune recette initiale générée.",
        refineErrorGeneric: "Une erreur inattendue s'est produite lors de l'affinage : {message}. Veuillez réessayer plus tard.",
        refineErrorUnknown: "Une erreur inattendue s'est produite lors de l'affinage de la recette. Veuillez réessayer plus tard.",
        generateErrorGeneric: "Une erreur inattendue s'est produite : {message}. Veuillez réessayer plus tard.",
        generateErrorUnknown: "Une erreur inattendue s'est produite lors de la génération de la recette. Veuillez réessayer plus tard.",
        generateAltErrorMissingIngredients: "Impossible de générer une alternative - la liste originale des ingrédients est manquante.",
    },
    "de": {
        title: "KühlschrankChef",
        tagline: "Sagen Sie uns, was in Ihrem Kühlschrank ist, und wir zaubern ein Rezept für Sie!",
        ingredientsTitle: "Ihre Zutaten",
        ingredientsDescription: "Zutaten eingeben, Sprache wählen und optional eine Geschmackspräferenz auswählen.",
        recipeTitle: "Rezeptvorschlag",
        recipeDescriptionGenerated: "Basierend auf Ihren Zutaten generiert.",
        recipeDescriptionRefined: "Verfeinertes Rezept basierend auf Ihrem Feedback.",
        recipeDescriptionPlaceholder: "Ihr generiertes Rezept wird hier erscheinen.",
        generatingAltText: "Generiere dein leckeres Rezept...",
        refiningAltText: "Verfeinere das Rezept...",
        loadingPlaceholder: "Bitte warten Sie, während der Koch nachdenkt...",
        errorPlaceholder: "Beim Generieren oder Verfeinern des Rezepts ist ein Problem aufgetreten.",
        errorTitle: "Fehler",
        footerText: "KühlschrankChef. Unterstützt durch KI.",
        selectLanguagePlaceholder: "Sprache auswählen",
        selectTastePlaceholder: "Geschmackspräferenz (Optional)",
        inputErrorNoIngredients: "Keine Zutaten angegeben. Bitte listen Sie die vorhandenen Zutaten auf.",
        generateFailedGeneric: "Rezept konnte nicht generiert werden. Die KI ist möglicherweise nicht verfügbar oder die Anfrage ist fehlgeschlagen.",
        generateFailedInsufficient: "Rezept konnte nicht generiert werden. Die bereitgestellten Zutaten reichen möglicherweise nicht aus oder passen nicht für ein komplettes Gericht.",
        refineFailedGeneric: "Rezept konnte nicht verfeinert werden. Die KI ist möglicherweise nicht verfügbar oder die Anfrage ist fehlgeschlagen.",
        refineErrorNoRecipe: "Rezept kann nicht verfeinert werden - kein ursprüngliches Rezept generiert.",
        refineErrorGeneric: "Beim Verfeinern ist ein unerwarteter Fehler aufgetreten: {message}. Bitte versuchen Sie es später erneut.",
        refineErrorUnknown: "Beim Verfeinern des Rezepts ist ein unerwarteter Fehler aufgetreten. Bitte versuchen Sie es später erneut.",
        generateErrorGeneric: "Ein unerwarteter Fehler ist aufgetreten: {message}. Bitte versuchen Sie es später erneut.",
        generateErrorUnknown: "Beim Generieren des Rezepts ist ein unerwarteter Fehler aufgetreten. Bitte versuchen Sie es später erneut.",
        generateAltErrorMissingIngredients: "Alternative kann nicht generiert werden - ursprüngliche Zutatenliste fehlt.",
    },
    "hi": { // Hindi Translations
        title: "फ्रिजशेफ",
        tagline: "हमें बताएं कि आपके फ्रिज में क्या है, और हम आपके लिए एक रेसिपी तैयार करेंगे!",
        ingredientsTitle: "आपकी सामग्री",
        ingredientsDescription: "सामग्री दर्ज करें, भाषा चुनें, और वैकल्पिक रूप से स्वाद वरीयता चुनें।",
        recipeTitle: "सुझाई गई रेसिपी",
        recipeDescriptionGenerated: "आपकी सामग्री के आधार पर उत्पन्न।",
        recipeDescriptionRefined: "आपकी प्रतिक्रिया के आधार पर परिष्कृत रेसिपी।",
        recipeDescriptionPlaceholder: "आपकी उत्पन्न रेसिपी यहां दिखाई देगी।",
        generatingAltText: "आपकी स्वादिष्ट रेसिपी तैयार हो रही है...",
        refiningAltText: "रेसिपी को परिष्कृत किया जा रहा है...",
        loadingPlaceholder: "कृपया प्रतीक्षा करें जब तक शेफ सोच रहा है...",
        errorPlaceholder: "रेसिपी बनाने या परिष्कृत करने में कोई समस्या हुई।",
        errorTitle: "त्रुटि",
        footerText: "फ्रिजशेफ। एआई द्वारा संचालित।",
        selectLanguagePlaceholder: "भाषा चुनें",
        selectTastePlaceholder: "स्वाद वरीयता (वैकल्पिक)",
        inputErrorNoIngredients: "कोई सामग्री प्रदान नहीं की गई। कृपया आपके पास उपलब्ध सामग्री सूचीबद्ध करें।",
        generateFailedGeneric: "रेसिपी बनाने में विफल। एआई अनुपलब्ध हो सकती है या अनुरोध अप्रत्याशित रूप से विफल हो गया।",
        generateFailedInsufficient: "रेसिपी बनाने में विफल। प्रदान की गई सामग्री पूरी डिश के लिए अपर्याप्त या असंगत हो सकती है।",
        refineFailedGeneric: "रेसिपी को परिष्कृत करने में विफल। एआई अनुपलब्ध हो सकती है या अनुरोध अप्रत्याशित रूप से विफल हो गया।",
        refineErrorNoRecipe: "रेसिपी परिष्कृत नहीं की जा सकती - कोई प्रारंभिक रेसिपी नहीं बनाई गई।",
        refineErrorGeneric: "परिष्करण के दौरान एक अप्रत्याशित त्रुटि हुई: {message}। कृपया बाद में पुनः प्रयास करें।",
        refineErrorUnknown: "रेसिपी परिष्कृत करते समय एक अप्रत्याशित त्रुटि हुई। कृपया बाद में पुनः प्रयास करें।",
        generateErrorGeneric: "एक अप्रत्याशित त्रुटि हुई: {message}। कृपया बाद में पुनः प्रयास करें।",
        generateErrorUnknown: "रेसिपी बनाते समय एक अप्रत्याशित त्रुटि हुई। कृपया बाद में पुनः प्रयास करें।",
        generateAltErrorMissingIngredients: "विकल्प उत्पन्न नहीं किया जा सकता - मूल सामग्री सूची गायब है।",
    },
    "bn": { // Bengali Translations
        title: "ফ্রিজশেফ",
        tagline: "আপনার ফ্রিজে কী আছে বলুন, এবং আমরা আপনার জন্য একটি রেসিপি তৈরি করব!",
        ingredientsTitle: "আপনার উপকরণ",
        ingredientsDescription: "উপকরণ লিখুন, ভাষা নির্বাচন করুন, এবং ঐচ্ছিকভাবে একটি স্বাদের পছন্দ নির্বাচন করুন।",
        recipeTitle: "প্রস্তাবিত রেসিপি",
        recipeDescriptionGenerated: "আপনার উপকরণের উপর ভিত্তি করে তৈরি।",
        recipeDescriptionRefined: "আপনার মতামতের উপর ভিত্তি করে পরিমার্জিত রেসিপি।",
        recipeDescriptionPlaceholder: "আপনার তৈরি রেসিপি এখানে প্রদর্শিত হবে।",
        generatingAltText: "আপনার সুস্বাদু রেসিপি তৈরি হচ্ছে...",
        refiningAltText: "রেসিপি পরিমার্জন করা হচ্ছে...",
        loadingPlaceholder: "শেফ চিন্তা করার সময় দয়া করে অপেক্ষা করুন...",
        errorPlaceholder: "রেসিপি তৈরি বা পরিমার্জনে একটি সমস্যা হয়েছে।",
        errorTitle: "ত্রুটি",
        footerText: "ফ্রিজশেফ। এআই দ্বারা চালিত।",
        selectLanguagePlaceholder: "ভাষা নির্বাচন করুন",
        selectTastePlaceholder: "স্বাদের পছন্দ (ঐচ্ছিক)",
        inputErrorNoIngredients: "কোন উপকরণ প্রদান করা হয়নি। আপনার কাছে উপলব্ধ উপকরণ তালিকাভুক্ত করুন।",
        generateFailedGeneric: "একটি রেসিপি তৈরি করা যায়নি। এআই অনুপলব্ধ হতে পারে বা অনুরোধ অপ্রত্যাশিতভাবে ব্যর্থ হয়েছে।",
        generateFailedInsufficient: "একটি রেসিপি তৈরি করা যায়নি। প্রদত্ত উপাদানগুলি একটি সম্পূর্ণ খাবারের জন্য অপর্যাপ্ত বা বেমানান হতে পারে।",
        refineFailedGeneric: "রেসিপি পরিমার্জন করা যায়নি। এআই অনুপলব্ধ হতে পারে বা অনুরোধ অপ্রত্যাশিতভাবে ব্যর্থ হয়েছে।",
        refineErrorNoRecipe: "রেসিপি পরিমার্জন করা যাবে না - কোনো প্রাথমিক রেসিপি তৈরি হয়নি।",
        refineErrorGeneric: "পরিমার্জনের সময় একটি অপ্রত্যাশিত ত্রুটি ঘটেছে: {message}। অনুগ্রহ করে পরে আবার চেষ্টা করুন।",
        refineErrorUnknown: "রেসিপি পরিমার্জন করার সময় একটি অপ্রত্যাশিত ত্রুটি ঘটেছে। অনুগ্রহ করে পরে আবার চেষ্টা করুন।",
        generateErrorGeneric: "একটি অপ্রত্যাশিত ত্রুটি ঘটেছে: {message}। অনুগ্রহ করে পরে আবার চেষ্টা করুন।",
        generateErrorUnknown: "রেসিপি তৈরি করার সময় একটি অপ্রত্যাশিত ত্রুটি ঘটেছে। অনুগ্রহ করে পরে আবার চেষ্টা করুন।",
        generateAltErrorMissingIngredients: "বিকল্প তৈরি করা যাবে না - মূল উপকরণ তালিকা অনুপস্থিত।",
    },
     // Add more languages as needed
};

export default function Home() {
  const [recipe, setRecipe] = useState<RecipeState>(null);
  const [refinedRecipe, setRefinedRecipe] = useState<RefinedRecipeState>(null);
  const [alternativeTypes, setAlternativeTypes] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, startGenerating] = useTransition();
  const [isRefining, startRefining] = useTransition();
  const [latestSubmittedIngredientsString, setLatestSubmittedIngredientsString] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('en'); // Default to English
  const [selectedTaste, setSelectedTaste] = useState<TastePreference>('Any'); // State for taste preference

  // Get translated UI text based on selected language code
  const T = uiText[selectedLanguage] || uiText['en'];

  // Handler for initial recipe generation (and handling alternatives)
  const handleGenerateRecipe = async (ingredientsString: string, preferredType?: string) => {
    setError(null);
    setRecipe(null);
    setRefinedRecipe(null);
    setAlternativeTypes(null);
    if (!preferredType) {
        setLatestSubmittedIngredientsString(ingredientsString);
    }

     if (!ingredientsString) {
       setError(T.inputErrorNoIngredients);
       return;
     }

    const languageName = supportedLanguages[selectedLanguage]; // Get full language NAME (e.g., "English")
    const tastePreference = selectedTaste === 'Any' ? undefined : selectedTaste; // Don't pass 'Any'

    startGenerating(async () => {
      try {
        const result = await generateRecipe({
            ingredients: ingredientsString,
            preferredDishType: preferredType,
            language: languageName, // Pass the full language NAME
            tastePreference: tastePreference, // Pass the taste preference
        });

        // Explicitly check if the AI response indicates failure
        if (result && (result.recipeName.includes("Failed") || result.recipeName.includes("Error") || result.recipeName.includes("Unable"))) {
             // Use the note from the AI if it explains the failure, otherwise use a specific insufficient ingredients message
             setError(result.notes || T.generateFailedInsufficient);
             setRecipe(null);
             setAlternativeTypes(null);
        } else if (result) {
           setRecipe(result);
           if (!preferredType && result.alternativeDishTypes && result.alternativeDishTypes.length > 0) {
               setAlternativeTypes(result.alternativeDishTypes);
           } else {
                setAlternativeTypes(null);
           }
        } else {
          // If result is null/undefined, assume generic failure
          setError(T.generateFailedGeneric);
          setAlternativeTypes(null);
        }
      } catch (e) {
        console.error('Error generating recipe:', e);
        if (e instanceof Error) {
          setError(T.generateErrorGeneric.replace('{message}', e.message));
        } else {
          setError(T.generateErrorUnknown);
        }
         setAlternativeTypes(null);
      }
    });
  };

  // Handler to generate a recipe for one of the alternative types
  const handleGenerateAlternative = (dishType: string) => {
      if (!latestSubmittedIngredientsString) {
          setError(T.generateAltErrorMissingIngredients);
          return;
      }
      // Re-use the current taste preference when generating alternative
      handleGenerateRecipe(latestSubmittedIngredientsString, dishType);
  };


   // Handler for refining the recipe based on unavailable additional ingredients
  const handleRefineRecipe = async (unavailableAdditional: string[]) => {
    if (!recipe) {
      setError(T.refineErrorNoRecipe);
      return;
    }
    setError(null);
    setRefinedRecipe(null);

    const languageName = supportedLanguages[selectedLanguage]; // Get full language NAME (e.g., "English")
    const tastePreference = selectedTaste === 'Any' ? undefined : selectedTaste; // Don't pass 'Any'

    const refineInput: RefineRecipeInput = {
      originalRecipeName: recipe.recipeName,
      providedIngredients: recipe.providedIngredients || [],
      originalAdditionalIngredients: recipe.additionalIngredients || [],
      unavailableAdditionalIngredients: unavailableAdditional,
      originalInstructions: recipe.instructions,
      language: languageName, // Pass the full language NAME
      tastePreference: tastePreference, // Pass the taste preference
    };

    startRefining(async () => {
      try {
        const result = await refineRecipe(refineInput);

        if (result && (result.refinedRecipeName.includes("Failed") || result.refinedRecipeName.includes("Error") || result.refinedRecipeName.includes("Difficult"))) {
           setError(result.feasibilityNotes || T.refineFailedGeneric);
           setRefinedRecipe(null);
        } else if (result) {
          setRefinedRecipe(result);
          setAlternativeTypes(null); // Clear alternatives after refinement
        } else {
           setError(T.refineFailedGeneric);
        }

      } catch (e) {
         console.error('Error refining recipe:', e);
          if (e instanceof Error) {
            setError(T.refineErrorGeneric.replace('{message}', e.message));
          } else {
            setError(T.refineErrorUnknown);
          }
      }
    });
  };

  const isLoading = isGenerating || isRefining;

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 md:p-8 lg:p-12 bg-background">
      <header className="w-full max-w-4xl mb-8 text-center">
         <div className="flex justify-center items-center gap-4 mb-4">
          <UtensilsCrossed className="h-10 w-10 text-primary" />
          <h1 className="text-4xl font-bold text-primary tracking-tight">{T.title}</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          {T.tagline}
        </p>
         <div className="mt-4 flex justify-center items-center flex-wrap gap-4">
             <Select value={selectedLanguage} onValueChange={(value) => setSelectedLanguage(value as LanguageCode)}>
                <SelectTrigger className="w-[180px] h-9">
                     <Languages className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder={T.selectLanguagePlaceholder} />
                </SelectTrigger>
                <SelectContent>
                    {Object.entries(supportedLanguages).map(([code, name]) => (
                        <SelectItem key={code} value={code}>{name}</SelectItem>
                    ))}
                </SelectContent>
             </Select>
             {/* Taste Preference Dropdown */}
             <Select value={selectedTaste} onValueChange={(value) => setSelectedTaste(value as TastePreference)}>
                <SelectTrigger className="w-[240px] h-9">
                    {/* Consider adding a relevant icon like Utensils or similar */}
                    <SelectValue placeholder={T.selectTastePlaceholder} />
                </SelectTrigger>
                <SelectContent>
                    {supportedTastePreferences.map((taste) => (
                        <SelectItem key={taste} value={taste}>
                            {taste === "Any" ? `${taste} (Default)` : taste}
                        </SelectItem>
                    ))}
                </SelectContent>
             </Select>
         </div>
      </header>

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Ingredient Form Card */}
        <Card className="shadow-lg rounded-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-primary">{T.ingredientsTitle}</CardTitle>
            <CardDescription>
              {T.ingredientsDescription}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <IngredientForm
                onSubmit={(ingredients) => handleGenerateRecipe(ingredients)}
                isGenerating={isLoading}
                language={selectedLanguage} // Pass selected language code
             />
          </CardContent>
        </Card>

        {/* Recipe Display Card */}
        <Card className="shadow-lg rounded-lg flex flex-col min-h-[300px] justify-between">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-primary">{T.recipeTitle}</CardTitle>
             {!isLoading && !error && (recipe || refinedRecipe) && (
                <CardDescription>
                    {refinedRecipe ? T.recipeDescriptionRefined : (recipe ? T.recipeDescriptionGenerated : "")}
                    {/* Display notes from either refined or original recipe */}
                    {(refinedRecipe?.feasibilityNotes || recipe?.notes) && (
                         <span className="block mt-1 text-xs italic">
                            Note: {refinedRecipe?.feasibilityNotes || recipe?.notes}
                         </span>
                    )}
                </CardDescription>
             )}
             {!recipe && !refinedRecipe && !isLoading && !error && (
                <CardDescription>
                    {T.recipeDescriptionPlaceholder}
                </CardDescription>
             )}
             {isLoading && (
                 <CardDescription>
                    {T.loadingPlaceholder}
                 </CardDescription>
             )}
             {error && !isLoading && (
                 <CardDescription className="text-destructive">
                    {T.errorPlaceholder}
                 </CardDescription>
             )}
          </CardHeader>
          <CardContent className="flex-grow flex items-center justify-center">
            {isLoading ? (
              <div className="flex flex-col items-center text-muted-foreground">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p>{isGenerating ? T.generatingAltText : T.refiningAltText}</p>
              </div>
            ) : error ? (
               <Alert variant="destructive" className="w-full">
                  <TriangleAlert className="h-4 w-4" />
                  <AlertTitle>{T.errorTitle}</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
               </Alert>
            ) : recipe ? ( // Pass original recipe if available, refinedRecipe overlays parts of it
              <RecipeDisplay
                recipe={recipe} // Always pass the base recipe
                refinedRecipe={refinedRecipe} // Pass refinement results if available
                alternativeTypes={alternativeTypes}
                onRefine={handleRefineRecipe}
                onSelectAlternative={handleGenerateAlternative}
                isRefining={isRefining}
                isGenerating={isGenerating}
                language={selectedLanguage} // Pass selected language code
                tastePreference={selectedTaste} // Pass selected taste
              />
            ) : (
              // Initial placeholder state
              <div className="text-center text-muted-foreground space-y-4">
                 <Image
                    src="https://picsum.photos/seed/recipebook/300/200"
                    alt="Empty plate waiting for a recipe"
                    width={300}
                    height={200}
                    className="rounded-lg mx-auto shadow-md"
                    data-ai-hint="recipe book cooking illustration chef"
                    priority
                  />
                <p>{T.recipeDescriptionPlaceholder}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} {T.footerText}</p>
      </footer>
    </main>
  );
}

