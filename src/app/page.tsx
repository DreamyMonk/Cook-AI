
'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { IngredientForm } from '@/components/ingredient-form';
import { RecipeDisplay, type RecipeDisplayData } from '@/components/recipe-display'; // Update import
import { generateRecipe, type GenerateRecipeOutput } from '@/ai/flows/generate-recipe';
import { generateProMenu, type GenerateProMenuInput, type GenerateProMenuOutput } from '@/ai/flows/generate-pro-menu'; // Import new flow
import { refineRecipe, type RefineRecipeInput, type RefineRecipeOutput } from '@/ai/flows/refine-recipe';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, UtensilsCrossed, TriangleAlert, Languages, ChefHat, PartyPopper, BrainCircuit, Info } from 'lucide-react'; // Added BrainCircuit, Info
import Image from 'next/image';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from '@/components/ui/textarea';


// State for the main recipe generation result (can be single or multi-recipe)
type RecipeResultState = GenerateRecipeOutput | GenerateProMenuOutput | null; // Unified state type
// State for the refined recipe result (refinement applies only to single recipe)
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
export type LanguageCode = keyof typeof supportedLanguages;

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

// Course Types for Pro Mode
export const courseTypes = ['starter', 'main', 'dessert'] as const;
export type CourseType = typeof courseTypes[number];


// UI Text translations (keyed by LanguageCode) - Add Pro Chef text
const uiText = {
    "en": {
        title: "Cook AI",
        tagline: "Tell us what's in your fridge, or describe your perfect event menu, and we'll whip up a recipe or a full plan!", // Updated tagline
        ingredientsTitle: "Your Ingredients",
        ingredientsDescription: "Enter ingredients, select language, and optionally choose a taste preference.",
        proChefInputTitle: "Plan Your Event Menu", // New title for pro mode input card
        proChefInputDescription: "Describe the event, desired courses, guest count, and any preferences (cuisine, diet) to generate a custom menu. You can optionally list key ingredients you must use.", // Updated description for pro mode
        proChefModeLabel: "Pro Chef Mode",
        proChefModeDescription: "Plan a multi-course menu for an event!",
        eventThemeLabel: "Event Theme/Name",
        eventThemePlaceholder: "e.g., Summer BBQ, Birthday Dinner",
        numGuestsLabel: "Number of Guests",
        coursesLabel: "Select Courses",
        courseStarter: "Starter",
        courseMain: "Main Course",
        courseDessert: "Dessert",
        proPreferencesLabel: "Menu Preferences & Details", // Updated Label
        proPreferencesPlaceholder: "e.g., Vegetarian options, avoid nuts, Italian cuisine focus, feature salmon...", // Updated Placeholder
        proOptionalIngredientsLabel: "Key Ingredients (Optional)", // Added label
        proOptionalIngredientsPlaceholder: "e.g., Salmon, Asparagus, Lemon...", // Added placeholder
        proOptionalIngredientsDesc: "List any specific ingredients the chef MUST include in the menu.", // Added description
        recipeTitle: "Suggested Recipe / Menu", // Updated
        recipeDescriptionGenerated: "Generated based on your input.", // Updated
        recipeDescriptionRefined: "Refined recipe based on your feedback.",
        recipeDescriptionProMenu: "Pro menu generated for your event.", // New description
        recipeDescriptionPlaceholder: "Your generated recipe or menu will appear here.", // Updated
        generatingAltText: "Generating your delicious recipe...",
        generatingProAltText: "Generating your professional menu...", // New loading text
        refiningAltText: "Refining the recipe...",
        loadingPlaceholder: "Please wait while the chef is thinking...",
        errorPlaceholder: "There was an issue generating or refining the recipe/menu.", // Updated
        errorTitle: "Error",
        footerText: "Cook AI. Powered by zedsu made with ❤️ by saptrishi",
        selectLanguagePlaceholder: "Select Language",
        selectTastePlaceholder: "Taste Preference (Optional)",
        inputErrorNoIngredients: "No ingredients provided. Please list the ingredients you have.",
        generateFailedGeneric: "Could not generate a recipe/menu. The AI might be unavailable or the request failed unexpectedly.", // Updated
        generateFailedInsufficient: "Could not generate a recipe/menu. The provided input may be insufficient or conflicting for a complete dish/menu.", // Updated
        refineFailedGeneric: "Could not refine the recipe. The AI might be unavailable or the request failed unexpectedly.",
        refineErrorNoRecipe: "Cannot refine recipe - no initial single recipe generated.", // Clarified
        refineErrorGeneric: "An unexpected error occurred during refinement: {message}. Please try again later.",
        refineErrorUnknown: "An unexpected error occurred while refining the recipe. Please try again later.",
        generateErrorGeneric: "An unexpected error occurred: {message}. Please try again later.",
        generateErrorUnknown: "An unexpected error occurred while generating the recipe/menu. Please try again later.", // Updated
        generateAltErrorMissingIngredients: "Cannot generate alternative - original ingredients list is missing.",
        comingSoonBanner: "Recipe download & Pro Chef features coming soon!",
        serverComponentError: "An unexpected server error occurred. Please try again later. (Details omitted for security)",
        inputErrorNumGuests: "Please enter a valid number of guests (1 or more).", // New error
        inputErrorNoCourses: "Please select at least one course for the Pro menu.", // New error
        inputErrorNoTheme: "Please provide a theme or name for the event.", // New error for pro mode
        proInfoText: "The AI will suggest ingredients based on your menu plan. You can optionally list key ingredients you *must* use below.", // Added for info box
        generateProButtonLabel: "Generate Pro Menu", // Added button label
    },
    "es": {
        title: "Cook AI",
        tagline: "¡Dinos qué hay en tu nevera, o describe el menú perfecto para tu evento, y prepararemos una receta o un plan completo!",
        ingredientsTitle: "Tus Ingredientes",
        ingredientsDescription: "Ingresa ingredientes, selecciona idioma y opcionalmente elige una preferencia de sabor.",
        proChefInputTitle: "Planifica el Menú de tu Evento",
        proChefInputDescription: "Describe el evento, los platos deseados, el número de invitados y cualquier preferencia (cocina, dieta) para generar un menú personalizado. Opcionalmente, puedes listar ingredientes clave que debes usar.",
        proChefModeLabel: "Modo Chef Profesional",
        proChefModeDescription: "¡Planifica un menú de varios platos para un evento!",
        eventThemeLabel: "Tema/Nombre del Evento",
        eventThemePlaceholder: "ej., Barbacoa de Verano, Cena de Cumpleaños",
        numGuestsLabel: "Número de Invitados",
        coursesLabel: "Seleccionar Platos",
        courseStarter: "Entrante",
        courseMain: "Plato Principal",
        courseDessert: "Postre",
        proPreferencesLabel: "Preferencias y Detalles del Menú",
        proPreferencesPlaceholder: "ej., Opciones vegetarianas, evitar nueces, enfoque cocina italiana, destacar salmón...",
        proOptionalIngredientsLabel: "Ingredientes Clave (Opcional)",
        proOptionalIngredientsPlaceholder: "ej., Salmón, Espárragos, Limón...",
        proOptionalIngredientsDesc: "Lista cualquier ingrediente específico que el chef DEBE incluir en el menú.",
        recipeTitle: "Receta / Menú Sugerido",
        recipeDescriptionGenerated: "Generado según tu entrada.",
        recipeDescriptionRefined: "Receta refinada basada en tus comentarios.",
        recipeDescriptionProMenu: "Menú profesional generado para tu evento.",
        recipeDescriptionPlaceholder: "Tu receta o menú generado aparecerá aquí.",
        generatingAltText: "Generando tu deliciosa receta...",
        generatingProAltText: "Generando tu menú profesional...",
        refiningAltText: "Refinando la receta...",
        loadingPlaceholder: "Por favor espera mientras el chef piensa...",
        errorPlaceholder: "Hubo un problema al generar o refinar la receta/menú.",
        errorTitle: "Error",
        footerText: "Cook AI. Impulsado por zedsu hecho con ❤️ por saptrishi",
        selectLanguagePlaceholder: "Seleccionar Idioma",
        selectTastePlaceholder: "Preferencia de Sabor (Opcional)",
        inputErrorNoIngredients: "No se proporcionaron ingredientes. Por favor, enumera los ingredientes que tienes.",
        generateFailedGeneric: "No se pudo generar una receta/menú. La IA podría no estar disponible o la solicitud falló inesperadamente.",
        generateFailedInsufficient: "No se pudo generar una receta/menú. La entrada proporcionada puede ser insuficiente o conflictiva para un plato/menú completo.",
        refineFailedGeneric: "No se pudo refinar la receta. La IA podría no estar disponible o la solicitud falló inesperadamente.",
        refineErrorNoRecipe: "No se puede refinar la receta - no se generó ninguna receta inicial individual.",
        refineErrorGeneric: "Ocurrió un error inesperado durante el refinamiento: {message}. Por favor, inténtalo de nuevo más tarde.",
        refineErrorUnknown: "Ocurrió un error inesperado al refinar la receta. Por favor, inténtalo de nuevo más tarde.",
        generateErrorGeneric: "Ocurrió un error inesperado: {message}. Por favor, inténtalo de nuevo más tarde.",
        generateErrorUnknown: "Ocurrió un error inesperado al generar la receta/menú. Por favor, inténtalo de nuevo más tarde.",
        generateAltErrorMissingIngredients: "No se puede generar alternativa - falta la lista original de ingredientes.",
        comingSoonBanner: "¡Descarga de recetas y funciones Pro Chef próximamente!",
        serverComponentError: "Ocurrió un error inesperado en el servidor. Por favor, inténtalo de nuevo más tarde. (Detalles omitidos por seguridad)",
        inputErrorNumGuests: "Introduce un número válido de invitados (1 o más).",
        inputErrorNoCourses: "Selecciona al menos un plato para el menú Pro.",
        inputErrorNoTheme: "Proporciona un tema o nombre para el evento.",
        proInfoText: "La IA sugerirá ingredientes basados en tu plan de menú. Opcionalmente, puedes listar ingredientes clave que *debes* usar a continuación.",
        generateProButtonLabel: "Generar Menú Pro",
    },
    "fr": {
        title: "Cook AI",
        tagline: "Dites-nous ce qu'il y a dans votre frigo, ou décrivez le menu parfait pour votre événement, et nous concocterons une recette ou un plan complet !",
        ingredientsTitle: "Vos Ingrédients",
        ingredientsDescription: "Entrez les ingrédients, sélectionnez la langue et choisissez éventuellement une préférence gustative.",
        proChefInputTitle: "Planifiez le Menu de votre Événement",
        proChefInputDescription: "Décrivez l'événement, les plats souhaités, le nombre d'invités et toutes les préférences (cuisine, régime) pour générer un menu personnalisé. Vous pouvez éventuellement lister les ingrédients clés que vous devez utiliser.",
        proChefModeLabel: "Mode Chef Pro",
        proChefModeDescription: "Planifiez un menu à plusieurs plats pour un événement !",
        eventThemeLabel: "Thème/Nom de l'événement",
        eventThemePlaceholder: "ex: BBQ d'été, Dîner d'anniversaire",
        numGuestsLabel: "Nombre d'invités",
        coursesLabel: "Sélectionner les plats",
        courseStarter: "Entrée",
        courseMain: "Plat principal",
        courseDessert: "Dessert",
        proPreferencesLabel: "Préférences et Détails du Menu",
        proPreferencesPlaceholder: "ex: Options végétariennes, éviter les noix, focus cuisine italienne, mettre en avant le saumon...",
        proOptionalIngredientsLabel: "Ingrédients Clés (Facultatif)",
        proOptionalIngredientsPlaceholder: "ex: Saumon, Asperges, Citron...",
        proOptionalIngredientsDesc: "Listez tout ingrédient spécifique que le chef DOIT inclure dans le menu.",
        recipeTitle: "Recette / Menu Suggéré",
        recipeDescriptionGenerated: "Généré(e) à partir de votre saisie.",
        recipeDescriptionRefined: "Recette affinée suite à vos commentaires.",
        recipeDescriptionProMenu: "Menu pro généré pour votre événement.",
        recipeDescriptionPlaceholder: "Votre recette ou menu généré apparaîtra ici.",
        generatingAltText: "Génération de votre délicieuse recette...",
        generatingProAltText: "Génération de votre menu professionnel...",
        refiningAltText: "Affinement de la recette...",
        loadingPlaceholder: "Veuillez patienter pendant que le chef réfléchit...",
        errorPlaceholder: "Un problème est survenu lors de la génération ou de l'affinage de la recette/menu.",
        errorTitle: "Erreur",
        footerText: "Cook AI. Propulsé par zedsu fait avec ❤️ par saptrishi",
        selectLanguagePlaceholder: "Choisir la Langue",
        selectTastePlaceholder: "Préférence Gustative (Facultatif)",
        inputErrorNoIngredients: "Aucun ingrédient fourni. Veuillez lister les ingrédients dont vous disposez.",
        generateFailedGeneric: "Impossible de générer une recette/menu. L'IA est peut-être indisponible ou la requête a échoué.",
        generateFailedInsufficient: "Impossible de générer une recette/menu. L'entrée fournie peut être insuffisante ou conflictuelle pour un plat/menu complet.",
        refineFailedGeneric: "Impossible d'affiner la recette. L'IA est peut-être indisponible ou la requête a échoué.",
        refineErrorNoRecipe: "Impossible d'affiner la recette - aucune recette initiale unique générée.",
        refineErrorGeneric: "Une erreur inattendue s'est produite lors de l'affinage : {message}. Veuillez réessayer plus tard.",
        refineErrorUnknown: "Une erreur inattendue s'est produite lors de l'affinage de la recette. Veuillez réessayer plus tard.",
        generateErrorGeneric: "Une erreur inattendue s'est produite : {message}. Veuillez réessayer plus tard.",
        generateErrorUnknown: "Une erreur inattendue s'est produite lors de la génération de la recette/menu. Veuillez réessayer plus tard.",
        generateAltErrorMissingIngredients: "Impossible de générer une alternative - la liste originale des ingrédients est manquante.",
        comingSoonBanner: "Téléchargement de recettes et fonctionnalités Pro Chef bientôt disponibles !",
        serverComponentError: "Une erreur serveur inattendue s'est produite. Veuillez réessayer plus tard. (Détails omis pour la sécurité)",
        inputErrorNumGuests: "Veuillez entrer un nombre valide d'invités (1 ou plus).",
        inputErrorNoCourses: "Veuillez sélectionner au moins un plat pour le menu Pro.",
        inputErrorNoTheme: "Veuillez fournir un thème ou un nom pour l'événement.",
        proInfoText: "L'IA suggérera des ingrédients en fonction de votre plan de menu. Vous pouvez éventuellement lister les ingrédients clés que vous *devez* utiliser ci-dessous.",
        generateProButtonLabel: "Générer le Menu Pro",
    },
    "de": {
        title: "Cook AI",
        tagline: "Sagen Sie uns, was in Ihrem Kühlschrank ist, oder beschreiben Sie Ihr perfektes Event-Menü, und wir zaubern ein Rezept oder einen ganzen Plan!",
        ingredientsTitle: "Ihre Zutaten",
        ingredientsDescription: "Zutaten eingeben, Sprache wählen und optional eine Geschmackspräferenz auswählen.",
        proChefInputTitle: "Planen Sie Ihr Event-Menü",
        proChefInputDescription: "Beschreiben Sie die Veranstaltung, gewünschte Gänge, Gästeanzahl und Vorlieben (Küche, Diät), um ein individuelles Menü zu generieren. Optional können Sie Schlüsselzutaten angeben, die Sie verwenden müssen.",
        proChefModeLabel: "Profi-Koch-Modus",
        proChefModeDescription: "Planen Sie ein mehrgängiges Menü für eine Veranstaltung!",
        eventThemeLabel: "Veranstaltungsthema/Name",
        eventThemePlaceholder: "z.B. Sommergrillen, Geburtstagsessen",
        numGuestsLabel: "Anzahl der Gäste",
        coursesLabel: "Gänge auswählen",
        courseStarter: "Vorspeise",
        courseMain: "Hauptgericht",
        courseDessert: "Dessert",
        proPreferencesLabel: "Menü-Vorlieben & Details",
        proPreferencesPlaceholder: "z.B. Vegetarische Optionen, Nüsse vermeiden, Fokus italienische Küche, Lachs hervorheben...",
        proOptionalIngredientsLabel: "Schlüsselzutaten (Optional)",
        proOptionalIngredientsPlaceholder: "z.B. Lachs, Spargel, Zitrone...",
        proOptionalIngredientsDesc: "Listen Sie spezifische Zutaten auf, die der Koch UNBEDINGT in das Menü aufnehmen muss.",
        recipeTitle: "Rezept- / Menüvorschlag",
        recipeDescriptionGenerated: "Basierend auf Ihrer Eingabe generiert.",
        recipeDescriptionRefined: "Verfeinertes Rezept basierend auf Ihrem Feedback.",
        recipeDescriptionProMenu: "Profi-Menü für Ihre Veranstaltung generiert.",
        recipeDescriptionPlaceholder: "Ihr generiertes Rezept oder Menü wird hier erscheinen.",
        generatingAltText: "Generiere dein leckeres Rezept...",
        generatingProAltText: "Generiere dein professionelles Menü...",
        refiningAltText: "Verfeinere das Rezept...",
        loadingPlaceholder: "Bitte warten Sie, während der Koch nachdenkt...",
        errorPlaceholder: "Beim Generieren oder Verfeinern des Rezepts/Menüs ist ein Problem aufgetreten.",
        errorTitle: "Fehler",
        footerText: "Cook AI. Unterstützt durch zedsu gemacht mit ❤️ von saptrishi",
        selectLanguagePlaceholder: "Sprache auswählen",
        selectTastePlaceholder: "Geschmackspräferenz (Optional)",
        inputErrorNoIngredients: "Keine Zutaten angegeben. Bitte listen Sie die vorhandenen Zutaten auf.",
        generateFailedGeneric: "Rezept/Menü konnte nicht generiert werden. Die KI ist möglicherweise nicht verfügbar oder die Anfrage ist fehlgeschlagen.",
        generateFailedInsufficient: "Rezept/Menü konnte nicht generiert werden. Die bereitgestellte Eingabe reicht möglicherweise nicht aus oder widerspricht einem vollständigen Gericht/Menü.",
        refineFailedGeneric: "Rezept konnte nicht verfeinert werden. Die KI ist möglicherweise nicht verfügbar oder die Anfrage ist fehlgeschlagen.",
        refineErrorNoRecipe: "Rezept kann nicht verfeinert werden - kein ursprüngliches Einzelrezept generiert.",
        refineErrorGeneric: "Beim Verfeinern ist ein unerwarteter Fehler aufgetreten: {message}. Bitte versuchen Sie es später erneut.",
        refineErrorUnknown: "Beim Verfeinern des Rezepts ist ein unerwarteter Fehler aufgetreten. Bitte versuchen Sie es später erneut.",
        generateErrorGeneric: "Ein unerwarteter Fehler ist aufgetreten: {message}. Bitte versuchen Sie es später erneut.",
        generateErrorUnknown: "Beim Generieren des Rezepts/Menüs ist ein unerwarteter Fehler aufgetreten. Bitte versuchen Sie es später erneut.",
        generateAltErrorMissingIngredients: "Alternative kann nicht generiert werden - ursprüngliche Zutatenliste fehlt.",
        comingSoonBanner: "Rezept-Download & Pro Chef-Funktionen bald verfügbar!",
        serverComponentError: "Ein unerwarteter Serverfehler ist aufgetreten. Bitte versuchen Sie es später erneut. (Details aus Sicherheitsgründen weggelassen)",
        inputErrorNumGuests: "Bitte geben Sie eine gültige Anzahl von Gästen ein (1 oder mehr).",
        inputErrorNoCourses: "Bitte wählen Sie mindestens einen Gang für das Pro-Menü aus.",
        inputErrorNoTheme: "Bitte geben Sie ein Thema oder einen Namen für die Veranstaltung an.",
        proInfoText: "Die KI schlägt Zutaten basierend auf Ihrem Menüplan vor. Optional können Sie unten Schlüsselzutaten angeben, die Sie *verwenden* müssen.",
        generateProButtonLabel: "Profi-Menü generieren",
    },
    "hi": { // Hindi Translations
        title: "Cook AI",
        tagline: "हमें बताएं कि आपके फ्रिज में क्या है, या अपने आदर्श इवेंट मेनू का वर्णन करें, और हम एक रेसिपी या एक पूरी योजना तैयार करेंगे!",
        ingredientsTitle: "आपकी सामग्री",
        ingredientsDescription: "सामग्री दर्ज करें, भाषा चुनें, और वैकल्पिक रूप से स्वाद वरीयता चुनें।",
        proChefInputTitle: "अपने इवेंट मेनू की योजना बनाएं",
        proChefInputDescription: "इवेंट, वांछित कोर्स, मेहमानों की संख्या, और किसी भी प्राथमिकता (व्यंजन, आहार) का वर्णन करें ताकि एक कस्टम मेनू तैयार हो सके। आप वैकल्पिक रूप से मुख्य सामग्री सूचीबद्ध कर सकते हैं जिनका आपको उपयोग करना चाहिए।",
        proChefModeLabel: "प्रो शेफ मोड",
        proChefModeDescription: "एक कार्यक्रम के लिए बहु-कोर्स मेनू की योजना बनाएं!",
        eventThemeLabel: "कार्यक्रम थीम/नाम",
        eventThemePlaceholder: "उदा., समर BBQ, जन्मदिन का खाना",
        numGuestsLabel: "मेहमानों की संख्या",
        coursesLabel: "कोर्स चुनें",
        courseStarter: "स्टार्टर",
        courseMain: "मुख्य कोर्स",
        courseDessert: "मिठाई",
        proPreferencesLabel: "मेनू प्राथमिकताएं और विवरण",
        proPreferencesPlaceholder: "उदा., शाकाहारी विकल्प, नट्स से बचें, इतालवी व्यंजन फोकस, सामन सुविधा...",
        proOptionalIngredientsLabel: "मुख्य सामग्री (वैकल्पिक)",
        proOptionalIngredientsPlaceholder: "उदा., सामन, शतावरी, नींबू...",
        proOptionalIngredientsDesc: "कोई भी विशिष्ट सामग्री सूचीबद्ध करें जिसे शेफ को मेनू में शामिल करना चाहिए।",
        recipeTitle: "सुझाई गई रेसिपी / मेनू",
        recipeDescriptionGenerated: "आपकी इनपुट के आधार पर उत्पन्न।",
        recipeDescriptionRefined: "आपकी प्रतिक्रिया के आधार पर परिष्कृत रेसिपी।",
        recipeDescriptionProMenu: "आपके कार्यक्रम के लिए प्रो मेनू उत्पन्न।",
        recipeDescriptionPlaceholder: "आपकी उत्पन्न रेसिपी या मेनू यहां दिखाई देगा।",
        generatingAltText: "आपकी स्वादिष्ट रेसिपी तैयार हो रही है...",
        generatingProAltText: "आपका पेशेवर मेनू तैयार हो रहा है...",
        refiningAltText: "रेसिपी को परिष्कृत किया जा रहा है...",
        loadingPlaceholder: "कृपया प्रतीक्षा करें जब तक शेफ सोच रहा है...",
        errorPlaceholder: "रेसिपी/मेनू बनाने या परिष्कृत करने में कोई समस्या हुई।",
        errorTitle: "त्रुटि",
        footerText: "Cook AI. ज़ेडसु द्वारा संचालित ❤️ द्वारा बनाया गया सप्तऋषि",
        selectLanguagePlaceholder: "भाषा चुनें",
        selectTastePlaceholder: "स्वाद वरीयता (वैकल्पिक)",
        inputErrorNoIngredients: "कोई सामग्री प्रदान नहीं की गई। कृपया आपके पास उपलब्ध सामग्री सूचीबद्ध करें।",
        generateFailedGeneric: "रेसिपी/मेनू बनाने में विफल। एआई अनुपलब्ध हो सकती है या अनुरोध अप्रत्याशित रूप से विफल हो गया।",
        generateFailedInsufficient: "रेसिपी/मेनू बनाने में विफल। प्रदान की गई इनपुट पूरी डिश/मेनू के लिए अपर्याप्त या विरोधाभासी हो सकती है।",
        refineFailedGeneric: "रेसिपी को परिष्कृत करने में विफल। एआई अनुपलब्ध हो सकती है या अनुरोध अप्रत्याशित रूप से विफल हो गया।",
        refineErrorNoRecipe: "रेसिपी परिष्कृत नहीं की जा सकती - कोई प्रारंभिक एकल रेसिपी नहीं बनाई गई।",
        refineErrorGeneric: "परिष्करण के दौरान एक अप्रत्याशित त्रुटि हुई: {message}। कृपया बाद में पुनः प्रयास करें।",
        refineErrorUnknown: "रेसिपी परिष्कृत करते समय एक अप्रत्याशित त्रुटि हुई। कृपया बाद में पुनः प्रयास करें।",
        generateErrorGeneric: "एक अप्रत्याशित त्रुटि हुई: {message}। कृपया बाद में पुनः प्रयास करें।",
        generateErrorUnknown: "रेसिपी/मेनू बनाते समय एक अप्रत्याशित त्रुटि हुई। कृपया बाद में पुनः प्रयास करें।",
        generateAltErrorMissingIngredients: "विकल्प उत्पन्न नहीं किया जा सकता - मूल सामग्री सूची गायब है।",
        comingSoonBanner: "रेसिपी डाउनलोड और प्रो शेफ सुविधाएँ जल्द ही आ रही हैं!",
        serverComponentError: "एक अप्रत्याशित सर्वर त्रुटि हुई। कृपया बाद में पुनः प्रयास करें। (सुरक्षा कारणों से विवरण छोड़े गए)",
        inputErrorNumGuests: "कृपया मेहमानों की एक मान्य संख्या दर्ज करें (1 या अधिक)।",
        inputErrorNoCourses: "प्रो मेनू के लिए कृपया कम से कम एक कोर्स चुनें।",
        inputErrorNoTheme: "कृपया घटना के लिए एक थीम या नाम प्रदान करें।",
        proInfoText: "एआई आपके मेनू योजना के आधार पर सामग्री सुझाएगा। आप वैकल्पिक रूप से नीचे मुख्य सामग्री सूचीबद्ध कर सकते हैं जिनका आपको *उपयोग* करना चाहिए।",
        generateProButtonLabel: "प्रो मेनू बनाएं",
    },
    "bn": { // Bengali Translations
        title: "Cook AI",
        tagline: "আপনার ফ্রিজে কী আছে বলুন, অথবা আপনার নিখুঁত ইভেন্ট মেনু বর্ণনা করুন, এবং আমরা একটি রেসিপি বা একটি সম্পূর্ণ পরিকল্পনা তৈরি করব!",
        ingredientsTitle: "আপনার উপকরণ",
        ingredientsDescription: "উপকরণ লিখুন, ভাষা নির্বাচন করুন, এবং ঐচ্ছিকভাবে একটি স্বাদের পছন্দ নির্বাচন করুন।",
        proChefInputTitle: "আপনার ইভেন্ট মেনু পরিকল্পনা করুন",
        proChefInputDescription: "ইভেন্ট, কাঙ্ক্ষিত কোর্স, অতিথির সংখ্যা, এবং যেকোনো পছন্দ (রন্ধনশৈলী, ডায়েট) বর্ণনা করুন একটি কাস্টম মেনু তৈরি করতে। আপনি ঐচ্ছিকভাবে প্রধান উপকরণ তালিকাভুক্ত করতে পারেন যা আপনাকে অবশ্যই ব্যবহার করতে হবে।",
        proChefModeLabel: "প্রো শেফ মোড",
        proChefModeDescription: "একটি অনুষ্ঠানের জন্য বহু-কোর্স মেনু পরিকল্পনা করুন!",
        eventThemeLabel: "অনুষ্ঠানের থিম/নাম",
        eventThemePlaceholder: "যেমন, গ্রীষ্মকালীন BBQ, জন্মদিনের ডিনার",
        numGuestsLabel: "অতিথির সংখ্যা",
        coursesLabel: "কোর্স নির্বাচন করুন",
        courseStarter: "স্টার্টার",
        courseMain: "প্রধান কোর্স",
        courseDessert: "ডেজার্ট",
        proPreferencesLabel: "মেনু পছন্দ ও বিবরণ",
        proPreferencesPlaceholder: "যেমন, নিরামিষ বিকল্প, বাদাম এড়িয়ে চলুন, ইতালীয় রন্ধনশৈলী ফোকাস, স্যামন বৈশিষ্ট্য...",
        proOptionalIngredientsLabel: "প্রধান উপকরণ (ঐচ্ছিক)",
        proOptionalIngredientsPlaceholder: "যেমন, স্যামন, অ্যাস্পারাগাস, লেবু...",
        proOptionalIngredientsDesc: "যেকোনো নির্দিষ্ট উপকরণ তালিকাভুক্ত করুন যা শেফকে মেনুতে অবশ্যই অন্তর্ভুক্ত করতে হবে।",
        recipeTitle: "প্রস্তাবিত রেসিপি / মেনু",
        recipeDescriptionGenerated: "আপনার ইনপুটের উপর ভিত্তি করে তৈরি।",
        recipeDescriptionRefined: "আপনার মতামতের উপর ভিত্তি করে পরিমার্জিত রেসিপি।",
        recipeDescriptionProMenu: "আপনার অনুষ্ঠানের জন্য প্রো মেনু তৈরি করা হয়েছে।",
        recipeDescriptionPlaceholder: "আপনার তৈরি রেসিপি বা মেনু এখানে প্রদর্শিত হবে।",
        generatingAltText: "আপনার সুস্বাদু রেসিপি তৈরি হচ্ছে...",
        generatingProAltText: "আপনার পেশাদার মেনু তৈরি হচ্ছে...",
        refiningAltText: "রেসিপি পরিমার্জন করা হচ্ছে...",
        loadingPlaceholder: "শেফ চিন্তা করার সময় দয়া করে অপেক্ষা করুন...",
        errorPlaceholder: "রেসিপি/মেনু তৈরি বা পরিমার্জনে একটি সমস্যা হয়েছে।",
        errorTitle: "ত্রুটি",
        footerText: "Cook AI. জেডসু দ্বারা চালিত ❤️ দ্বারা তৈরি সপ্তর্ষি",
        selectLanguagePlaceholder: "ভাষা নির্বাচন করুন",
        selectTastePlaceholder: "স্বাদের পছন্দ (ঐচ্ছিক)",
        inputErrorNoIngredients: "কোন উপকরণ প্রদান করা হয়নি। আপনার কাছে উপলব্ধ উপকরণ তালিকাভুক্ত করুন।",
        generateFailedGeneric: "একটি রেসিপি/মেনু তৈরি করা যায়নি। এআই অনুপলব্ধ হতে পারে বা অনুরোধ অপ্রত্যাশিতভাবে ব্যর্থ হয়েছে।",
        generateFailedInsufficient: "একটি রেসিপি/মেনু তৈরি করা যায়নি। প্রদত্ত ইনপুট একটি সম্পূর্ণ ডিশ/মেনুর জন্য অপর্যাপ্ত বা পরস্পরবিরোধী হতে পারে।",
        refineFailedGeneric: "রেসিপি পরিমার্জন করা যায়নি। এআই অনুপলব্ধ হতে পারে বা অনুরোধ অপ্রত্যাশিতভাবে ব্যর্থ হয়েছে।",
        refineErrorNoRecipe: "রেসিপি পরিমার্জন করা যাবে না - কোনো প্রাথমিক একক রেসিপি তৈরি হয়নি।",
        refineErrorGeneric: "পরিমার্জনের সময় একটি অপ্রত্যাশিত ত্রুটি ঘটেছে: {message}। অনুগ্রহ করে পরে আবার চেষ্টা করুন।",
        refineErrorUnknown: "রেসিপি পরিমার্জন করার সময় একটি অপ্রত্যাশিত ত্রুটি ঘটেছে। অনুগ্রহ করে পরে আবার চেষ্টা করুন।",
        generateErrorGeneric: "একটি অপ্রত্যাশিত ত্রুটি ঘটেছে: {message}। অনুগ্রহ করে পরে আবার চেষ্টা করুন।",
        generateErrorUnknown: "রেসিপি/মেনু তৈরি করার সময় একটি অপ্রত্যাশিত ত্রুটি ঘটেছে। অনুগ্রহ করে পরে আবার চেষ্টা করুন।",
        comingSoonBanner: "রেসিপি ডাউনলোড এবং প্রো শেফ বৈশিষ্ট্য শীঘ্রই আসছে!",
        serverComponentError: "একটি অপ্রত্যাশিত সার্ভার ত্রুটি ঘটেছে। অনুগ্রহ করে পরে আবার চেষ্টা করুন। (নিরাপত্তার জন্য বিস্তারিত বাদ দেওয়া হয়েছে)",
        inputErrorNumGuests: "অনুগ্রহ করে অতিথিদের একটি বৈধ সংখ্যা লিখুন (1 বা তার বেশি)।",
        inputErrorNoCourses: "প্রো মেনুর জন্য অনুগ্রহ করে অন্তত একটি কোর্স নির্বাচন করুন।",
        inputErrorNoTheme: "অনুগ্রহ করে ইভেন্টের জন্য একটি থিম বা নাম প্রদান করুন।",
        proInfoText: "এআই আপনার মেনু পরিকল্পনার উপর ভিত্তি করে উপকরণ প্রস্তাব করবে। আপনি ঐচ্ছিকভাবে নীচের প্রধান উপকরণ তালিকাভুক্ত করতে পারেন যা আপনাকে *অবশ্যই* ব্যবহার করতে হবে।",
        generateProButtonLabel: "প্রো মেনু তৈরি করুন",
    },
     // Add more languages as needed
};

export default function Home() {
  const [recipeResult, setRecipeResult] = useState<RecipeResultState>(null); // Unified state
  const [refinedRecipe, setRefinedRecipe] = useState<RefinedRecipeState>(null);
  const [alternativeTypes, setAlternativeTypes] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, startGenerating] = useTransition();
  const [isRefining, startRefining] = useTransition();
  const [latestSubmittedIngredientsString, setLatestSubmittedIngredientsString] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('en'); // Default to English
  const [selectedTaste, setSelectedTaste] = useState<TastePreference>('Any'); // State for taste preference

  // Pro Chef Mode State
  const [isProChefMode, setIsProChefMode] = useState(false);
  const [eventTheme, setEventTheme] = useState('');
  const [numGuests, setNumGuests] = useState<number | ''>(2); // Default to 2 guests
  const [selectedCourses, setSelectedCourses] = useState<CourseType[]>(['main']); // Default to main course
  const [proPreferences, setProPreferences] = useState('');
  const [proIngredientsInput, setProIngredientsInput] = useState(''); // Dedicated input for Pro mode ingredients (if any specified)


  // Get translated UI text based on selected language code
  const T = uiText[selectedLanguage] || uiText['en'];

  // --- Event Handlers ---

  // Toggle Pro Chef Mode
  const handleProChefToggle = (checked: boolean) => {
    setIsProChefMode(checked);
    // Reset state when toggling mode
    setRecipeResult(null);
    setRefinedRecipe(null);
    setAlternativeTypes(null);
    setError(null);
    // Optionally reset Pro inputs when turning off
    if (!checked) {
        setEventTheme('');
        setNumGuests(2);
        setSelectedCourses(['main']);
        setProPreferences('');
        setProIngredientsInput(''); // Reset pro ingredients
    }
  };

  // Handle course selection change
  const handleCourseChange = (course: CourseType, checked: boolean | 'indeterminate') => {
    setSelectedCourses(prev => {
        if (checked === true) {
            return [...prev, course];
        } else {
            // Prevent unchecking the last course
            if (prev.length > 1) {
                return prev.filter(c => c !== course);
            }
            return prev; // Keep the last one checked
        }
    });
  };


  // Handler for initial recipe generation (now handles both modes)
  const handleGenerateRecipeOrMenu = async (ingredientsString?: string) => { // Make ingredients optional for standard mode too
    setError(null);
    setRecipeResult(null);
    setRefinedRecipe(null);
    setAlternativeTypes(null);

    const languageName = supportedLanguages[selectedLanguage]; // Get full language NAME (e.g., "English")
    const tastePreference = selectedTaste === 'Any' ? undefined : selectedTaste; // Don't pass 'Any'

    // Use proIngredientsInput for Pro Mode's ingredients field, allowing it to be empty
    const currentProIngredients = isProChefMode ? proIngredientsInput.trim() : '';

    // --- Validation ---
    if (isProChefMode) {
        if (!eventTheme.trim()) {
            setError(T.inputErrorNoTheme);
            return;
        }
        if (typeof numGuests !== 'number' || numGuests < 1) {
            setError(T.inputErrorNumGuests);
            return;
        }
        if (selectedCourses.length === 0) {
             setError(T.inputErrorNoCourses);
             return;
        }
        // Ingredients are optional in pro mode, use currentProIngredients which can be empty
        ingredientsString = currentProIngredients;

    } else { // Standard Mode Validation
        if (!ingredientsString || !ingredientsString.trim()) {
            setError(T.inputErrorNoIngredients);
            return;
        }
        // Save submitted ingredients only for standard mode for potential alternatives
        setLatestSubmittedIngredientsString(ingredientsString);
    }
    // --- End Validation ---

    startGenerating(async () => {
      try {
        let result: RecipeResultState = null;

        if (isProChefMode) {
            // --- Call Pro Chef Flow ---
            const proInput: GenerateProMenuInput = {
                ingredients: ingredientsString || '', // Pass empty string if no optional ingredients provided
                eventTheme: eventTheme,
                numGuests: numGuests as number, // Cast as number (validated above)
                courses: selectedCourses,
                preferences: proPreferences,
                language: languageName,
                tastePreference: tastePreference,
            };
            result = await generateProMenu(proInput);
            // Pro mode doesn't have alternatives or refinement in this structure
            setAlternativeTypes(null);
            setRefinedRecipe(null);

        } else {
            // --- Call Standard Recipe Flow ---
            const standardInput = {
                ingredients: ingredientsString!, // Validated above for standard mode
                // No preferredDishType here for initial generation
                language: languageName,
                tastePreference: tastePreference,
            };
             result = await generateRecipe(standardInput);
             // Set alternatives only for standard mode initial generation
             if (result && 'alternativeDishTypes' in result && result.alternativeDishTypes && result.alternativeDishTypes.length > 0) {
                 setAlternativeTypes(result.alternativeDishTypes);
             } else {
                 setAlternativeTypes(null);
             }
        }


        // --- Handle Result (Common for both flows) ---
        const recipeNameField = result && 'recipeName' in result ? result.recipeName : (result && 'menuTitle' in result ? result.menuTitle : null);
        const notesField = result && 'notes' in result ? result.notes : (result && 'chefNotes' in result ? result.chefNotes : null);

        if (result && recipeNameField && (recipeNameField.includes("Failed") || recipeNameField.includes("Error") || recipeNameField.includes("Unable"))) {
             setError(notesField || T.generateFailedInsufficient);
             setRecipeResult(null);
        } else if (result) {
           setRecipeResult(result);
        } else {
          setError(T.generateFailedGeneric);
        }
      } catch (e) {
        console.error(`Error generating ${isProChefMode ? 'menu' : 'recipe'}:`, e);
         if (e instanceof Error) {
             if (e.message.includes("An error occurred in the Server Components render") || (e as any).digest?.includes('SERVER_RENDER_ERROR')) {
                 setError(T.serverComponentError);
             } else {
                setError(T.generateErrorGeneric.replace('{message}', e.message));
             }
         } else {
             setError(T.generateErrorUnknown);
         }
         setAlternativeTypes(null); // Ensure alternatives are cleared on error
      }
    });
  };

  // Handler to generate a recipe for one of the alternative types (Standard Mode Only)
  // Needs slight modification to pass the selected type correctly
  const handleGenerateAlternative = (dishType: string) => {
      if (isProChefMode) return; // Should not be called in Pro mode
      if (!latestSubmittedIngredientsString) {
          setError(T.generateAltErrorMissingIngredients);
          return;
      }

      // --- Re-trigger generation with the preferred dish type ---
      setError(null);
      setRecipeResult(null);
      setRefinedRecipe(null);
      setAlternativeTypes(null);

      const languageName = supportedLanguages[selectedLanguage];
      const tastePreference = selectedTaste === 'Any' ? undefined : selectedTaste;

      startGenerating(async () => {
          try {
              const standardInput = {
                  ingredients: latestSubmittedIngredientsString,
                  preferredDishType: dishType, // Pass the selected type
                  language: languageName,
                  tastePreference: tastePreference,
              };
              const result = await generateRecipe(standardInput);

              const recipeNameField = result && 'recipeName' in result ? result.recipeName : null;
              const notesField = result && 'notes' in result ? result.notes : null;

              if (result && recipeNameField && (recipeNameField.includes("Failed") || recipeNameField.includes("Error") || recipeNameField.includes("Unable"))) {
                  setError(notesField || T.generateFailedInsufficient);
                  setRecipeResult(null);
              } else if (result) {
                  setRecipeResult(result);
              } else {
                  setError(T.generateFailedGeneric);
              }
          } catch (e) {
              console.error(`Error generating alternative recipe:`, e);
              if (e instanceof Error) {
                 if (e.message.includes("An error occurred in the Server Components render") || (e as any).digest?.includes('SERVER_RENDER_ERROR')) {
                     setError(T.serverComponentError);
                 } else {
                    setError(T.generateErrorGeneric.replace('{message}', e.message));
                 }
              } else {
                 setError(T.generateErrorUnknown);
              }
              setAlternativeTypes(null);
          }
      });
      // --- End re-trigger ---
  };


   // Handler for refining the recipe based on unavailable additional ingredients (Standard Mode Only)
  const handleRefineRecipe = async (unavailableAdditional: string[]) => {
    // Ensure we have a standard recipe output to refine
    if (isProChefMode || !recipeResult || !('recipeName' in recipeResult)) {
      setError(T.refineErrorNoRecipe);
      return;
    }
    setError(null);
    setRefinedRecipe(null);

    const languageName = supportedLanguages[selectedLanguage];
    const tastePreference = selectedTaste === 'Any' ? undefined : selectedTaste;

    const refineInput: RefineRecipeInput = {
      originalRecipeName: recipeResult.recipeName,
      providedIngredients: recipeResult.providedIngredients || [],
      originalAdditionalIngredients: recipeResult.additionalIngredients || [],
      unavailableAdditionalIngredients: unavailableAdditional,
      originalInstructions: recipeResult.instructions,
      language: languageName,
      tastePreference: tastePreference,
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
             if (e.message.includes("An error occurred in the Server Components render") || (e as any).digest?.includes('SERVER_RENDER_ERROR')) {
                 setError(T.serverComponentError);
             } else {
                setError(T.refineErrorGeneric.replace('{message}', e.message));
             }
          } else {
            setError(T.refineErrorUnknown);
          }
      }
    });
  };

  const isLoading = isGenerating || isRefining;

  // Determine the display data based on the current state
  let displayData: RecipeDisplayData | null = null;
  let recipeTitle = T.recipeTitle;
  let recipeDescription = T.recipeDescriptionPlaceholder;
  let showRefinementOptions = false;

  if (isLoading) {
      recipeDescription = T.loadingPlaceholder;
  } else if (error) {
      recipeDescription = T.errorPlaceholder;
  } else if (refinedRecipe) { // Check refined first
      displayData = { type: 'refined', data: refinedRecipe };
      recipeDescription = T.recipeDescriptionRefined;
      if (refinedRecipe.feasibilityNotes) {
          // recipeDescription += ` ${T.recipeNotePrefix} ${refinedRecipe.feasibilityNotes}`; // Append note prefix
      }
  } else if (recipeResult) {
      if ('menuTitle' in recipeResult) { // Pro Menu Output
          displayData = { type: 'pro-menu', data: recipeResult };
          recipeTitle = recipeResult.menuTitle || T.recipeTitle; // Use menu title if available
          recipeDescription = T.recipeDescriptionProMenu;
          if (recipeResult.chefNotes) {
             // recipeDescription += ` ${T.recipeNotePrefix} ${recipeResult.chefNotes}`; // Append note prefix
          }
      } else { // Standard Recipe Output
          displayData = { type: 'standard', data: recipeResult };
          recipeTitle = recipeResult.recipeName || T.recipeTitle;
          recipeDescription = T.recipeDescriptionGenerated;
          if (recipeResult.notes) {
              // recipeDescription += ` ${T.recipeNotePrefix} ${recipeResult.notes}`; // Append note prefix
          }
          // Show refinement only for standard recipe if additional ingredients exist
          showRefinementOptions = !!(recipeResult.additionalIngredients && recipeResult.additionalIngredients.length > 0);
      }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 md:p-8 lg:p-12 bg-gradient-to-br from-background to-secondary/30 dark:from-background dark:to-black/20">
      <header className="w-full max-w-4xl mb-8 text-center">
         <div className="flex justify-center items-center gap-3 mb-4">
          <UtensilsCrossed className="h-10 w-10 text-primary drop-shadow-md" />
          <h1 className="text-5xl font-bold text-primary tracking-tight drop-shadow-sm">{T.title}</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {T.tagline}
        </p>
         <div className="mt-6 flex justify-center items-center flex-wrap gap-4">
             <Select value={selectedLanguage} onValueChange={(value) => setSelectedLanguage(value as LanguageCode)}>
                <SelectTrigger className="w-[180px] h-10 shadow-sm bg-card">
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
                <SelectTrigger className="w-[240px] h-10 shadow-sm bg-card">
                    <ChefHat className="h-4 w-4 mr-2 text-muted-foreground" />
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
             {/* Pro Chef Mode Toggle */}
             <div className="flex items-center space-x-2 bg-card px-3 py-1.5 rounded-md shadow-sm border border-border">
                <Switch
                    id="pro-chef-mode"
                    checked={isProChefMode}
                    onCheckedChange={handleProChefToggle}
                    disabled={isLoading}
                    aria-labelledby="pro-chef-mode-label"
                />
                <Label htmlFor="pro-chef-mode" id="pro-chef-mode-label" className="flex items-center gap-1.5 font-medium text-primary cursor-pointer">
                    <BrainCircuit className="h-4 w-4" />
                    {T.proChefModeLabel}
                </Label>
            </div>
         </div>
      </header>

       {/* Coming Soon Banner */}
       <div className="w-full max-w-4xl mb-8">
            <Alert className="bg-accent/20 border-accent/50 text-accent-foreground shadow-md">
                <PartyPopper className="h-5 w-5 text-accent" />
                <AlertTitle className="font-semibold">Coming Soon!</AlertTitle>
                <AlertDescription>
                 {T.comingSoonBanner}
                </AlertDescription>
            </Alert>
       </div>


      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form Card */}
        <Card className="shadow-xl rounded-lg overflow-hidden">
          <CardHeader className="bg-primary/10 dark:bg-primary/20 p-5">
            <CardTitle className="text-2xl font-semibold text-primary flex items-center gap-2">
               <ChefHat className="h-6 w-6"/> {isProChefMode ? T.proChefInputTitle : T.ingredientsTitle}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {isProChefMode ? T.proChefInputDescription : T.ingredientsDescription}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-5">
            {/* Standard Ingredient Form (Conditional) */}
            {!isProChefMode && (
                <IngredientForm
                    onSubmit={(ingredients) => handleGenerateRecipeOrMenu(ingredients)}
                    isGenerating={isLoading}
                    language={selectedLanguage}
                 />
             )}

             {/* Pro Chef Mode Inputs (Conditional) */}
             {isProChefMode && (
                <div className="space-y-4">
                     <div className="text-xs text-muted-foreground italic p-2 border border-dashed border-accent/70 rounded-md bg-accent/10 dark:bg-accent/20 flex items-start gap-1.5">
                         <Info className="h-3 w-3 mr-1 flex-shrink-0 relative top-0.5 text-accent"/>
                         <span>{T.proInfoText}</span>
                     </div>
                     {/* Event Theme */}
                    <div>
                        <Label htmlFor="event-theme" className="text-sm text-muted-foreground">{T.eventThemeLabel}</Label>
                        <Input
                            id="event-theme"
                            value={eventTheme}
                            onChange={(e) => setEventTheme(e.target.value)}
                            placeholder={T.eventThemePlaceholder}
                            className="mt-1 bg-background"
                            disabled={isLoading}
                            required // Make theme required
                        />
                    </div>
                     {/* Number of Guests */}
                    <div>
                        <Label htmlFor="num-guests" className="text-sm text-muted-foreground">{T.numGuestsLabel}</Label>
                        <Input
                            id="num-guests"
                            type="number"
                            value={numGuests}
                            onChange={(e) => setNumGuests(e.target.value === '' ? '' : parseInt(e.target.value, 10) || '')}
                            min="1"
                            placeholder="e.g., 8"
                            className="mt-1 bg-background"
                            disabled={isLoading}
                            required // Make guests required
                        />
                    </div>
                     {/* Courses */}
                    <div>
                        <Label className="text-sm text-muted-foreground block mb-2">{T.coursesLabel}</Label>
                        <div className="flex flex-wrap gap-x-4 gap-y-2">
                            {courseTypes.map(course => (
                                <div key={course} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`course-${course}`}
                                        checked={selectedCourses.includes(course)}
                                        onCheckedChange={(checked) => handleCourseChange(course, checked)}
                                        disabled={isLoading || selectedCourses.length === 1 && selectedCourses.includes(course)} // Disable unchecking last item
                                    />
                                    <Label htmlFor={`course-${course}`} className="font-normal capitalize cursor-pointer">
                                        {course === 'main' ? T.courseMain : (course === 'starter' ? T.courseStarter : T.courseDessert)}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>
                     {/* Optional Key Ingredients for Pro Mode */}
                      <div>
                          <Label htmlFor="pro-ingredients-input" className="text-sm text-muted-foreground">
                              {T.proOptionalIngredientsLabel}
                          </Label>
                          <Textarea
                              id="pro-ingredients-input"
                              placeholder={T.proOptionalIngredientsPlaceholder}
                              className="resize-none min-h-[60px] bg-background mt-1"
                              value={proIngredientsInput}
                              onChange={(e) => setProIngredientsInput(e.target.value)}
                              aria-label={T.proOptionalIngredientsLabel}
                              disabled={isLoading}
                          />
                          <p className="text-xs text-muted-foreground mt-1">{T.proOptionalIngredientsDesc}</p>
                      </div>
                      {/* Additional Preferences */}
                    <div>
                        <Label htmlFor="pro-preferences" className="text-sm text-muted-foreground">{T.proPreferencesLabel}</Label>
                        <Textarea
                            id="pro-preferences"
                            value={proPreferences}
                            onChange={(e) => setProPreferences(e.target.value)}
                            placeholder={T.proPreferencesPlaceholder}
                            className="mt-1 bg-background min-h-[80px]"
                            disabled={isLoading}
                        />
                    </div>
                    {/* Submit Button for Pro Mode */}
                    <div className="pt-4">
                         <button
                           type="button"
                           onClick={() => handleGenerateRecipeOrMenu(proIngredientsInput)} // Pass optional ingredients
                           className="w-full bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary text-base h-11 shadow-md rounded-md inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                           disabled={isLoading}
                           aria-live="polite"
                         >
                           {isLoading ? (
                             <>
                               <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                               {T.generatingProAltText}
                             </>
                           ) : (
                             <>
                               <BrainCircuit className="mr-2 h-5 w-5" />
                               {T.generateProButtonLabel}
                             </>
                           )}
                         </button>
                    </div>
                </div>
             )}

          </CardContent>
        </Card>

        {/* Recipe Display Card */}
        <Card className="shadow-xl rounded-lg flex flex-col min-h-[350px] overflow-hidden">
          <CardHeader className="bg-primary/10 dark:bg-primary/20 p-5">
            <CardTitle className="text-2xl font-semibold text-primary flex items-center gap-2">
                <UtensilsCrossed className="h-6 w-6"/> {recipeTitle}
            </CardTitle>
             <CardDescription className={`text-muted-foreground ${error && !isLoading ? 'text-destructive' : ''}`}>
                 {recipeDescription}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 flex-grow flex items-center justify-center bg-card">
            {isLoading ? (
              <div className="flex flex-col items-center text-muted-foreground text-center p-8">
                <Loader2 className="h-16 w-16 animate-spin text-primary mb-6" />
                <p className="text-lg">{isGenerating ? (isProChefMode ? T.generatingProAltText : T.generatingAltText) : T.refiningAltText}</p>
              </div>
            ) : error ? (
               <Alert variant="destructive" className="w-full m-4">
                  <TriangleAlert className="h-5 w-5" />
                  <AlertTitle className="text-lg">{T.errorTitle}</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
               </Alert>
            ) : displayData ? ( // Check if displayData is available
              <RecipeDisplay
                displayData={displayData} // Pass the structured data
                alternativeTypes={alternativeTypes}
                onRefine={handleRefineRecipe}
                onSelectAlternative={handleGenerateAlternative}
                isRefining={isRefining}
                isGenerating={isGenerating}
                language={selectedLanguage}
                tastePreference={selectedTaste}
                showRefinementOptions={showRefinementOptions && !isProChefMode} // Pass flag to show refinement UI conditionally
              />
            ) : (
              // Initial placeholder state
              <div className="text-center text-muted-foreground space-y-6 p-8">
                 <Image
                    src="https://picsum.photos/seed/culinarydelight/350/230" // Updated seed
                    alt="Delicious food placeholder"
                    width={350}
                    height={230}
                    className="rounded-lg mx-auto shadow-lg border border-border"
                    data-ai-hint="culinary delight tasty dish gourmet plate" // Updated hint
                    priority
                  />
                <p className="text-lg">{T.recipeDescriptionPlaceholder}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <footer className="mt-16 text-center text-sm text-muted-foreground/80">
        <p>&copy; {new Date().getFullYear()} {T.footerText}</p>
      </footer>
    </main>
  );
}

    