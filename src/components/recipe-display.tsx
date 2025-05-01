
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

// UI Text translations
const uiText = {
    "en": {
        recipeNotePrefix: "Note:",
        ingredientsTitle: "Ingredients",
        ingredientsNotAvailable: "No ingredients listed.",
        mainIngredientsHeader: "**Main Ingredients:**",
        additionalIngredientsHeader: "**Additional Ingredients:**",
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
        mainIngredientsHeader: "**Ingredientes Principales:**",
        additionalIngredientsHeader: "**Ingredientes Adicionales:**",
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
        mainIngredientsHeader: "**Ingrédients Principaux :**",
        additionalIngredientsHeader: "**Ingrédients Additionnels :**",
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
        mainIngredientsHeader: "**Hauptzutaten:**",
        additionalIngredientsHeader: "**Zusätzliche Zutaten:**",
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
     // Add more languages as needed
};

// Supported languages mapping for language prop
const supportedLanguages = {
    "en": "English",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    // Add more as needed
};

interface RecipeDisplayProps {
  recipe: GenerateRecipeOutput;
  refinedRecipe: RefineRecipeOutput | null;
  alternativeTypes: string[] | null;
  onRefine: (unavailableAdditional: string[]) => void;
  onSelectAlternative: (dishType: string) => void;
  isRefining: boolean;
  isGenerating: boolean;
  language: string; // Receive language code (e.g., 'en', 'es')
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
    language // Receive language code
}: RecipeDisplayProps) {
  const [additionalIngredientsChecklist, setAdditionalIngredientsChecklist] = useState<AdditionalIngredientItem[]>([]);
  const [showRefineSection, setShowRefineSection] = useState(false);
  const [refineError, setRefineError] = useState<string | null>(null);

  const [detailedInstructions, setDetailedInstructions] = useState<string | null>(null);
  const [isExplaining, startExplaining] = useTransition();
  const [explainError, setExplainError] = useState<string | null>(null);
  const { toast } = useToast();

  // Get translated UI text
  const T = uiText[language as keyof typeof uiText] || uiText['en'];
  const languageName = supportedLanguages[language as keyof typeof supportedLanguages] || 'English';


  useEffect(() => {
    setDetailedInstructions(null);
    setExplainError(null);

    // Reset checklist when recipe changes or refinement occurs
    if (recipe && !refinedRecipe && recipe.additionalIngredients && recipe.additionalIngredients.length > 0) {
      const initialItems = recipe.additionalIngredients.map((name, index) => ({
        // Use a more robust key combination
        id: `add-ing-${index}-${recipe.recipeName?.replace(/\s+/g, '-') || 'recipe'}-${Date.now()}`,
        name: name,
        available: true,
      }));
      setAdditionalIngredientsChecklist(initialItems);
      setShowRefineSection(true); // Show checklist if there are items
      setRefineError(null);
    } else {
      setAdditionalIngredientsChecklist([]);
      setShowRefineSection(false); // Hide checklist if no items or refined
    }

    // Clear refinement error if the base recipe changes or is refined
    if (!refinedRecipe) {
        setRefineError(null);
    }

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
    const unavailable = additionalIngredientsChecklist
      .filter(ing => !ing.available)
      .map(ing => ing.name);

    onRefine(unavailable); // Pass only the names of unavailable items
  };

   const formatIngredientsList = (provided: string[] | undefined, additional: string[] | undefined): string => {
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
                    <li key={index}>{line.replace(/^\d+[\.\)]\s/, '')}</li>
                ))}
                </ol>
            );
        } else if (containsMarkdownFormatting) {
            // Use Tailwind typography for basic markdown styling
            return (
                 <div className="space-y-2 prose prose-sm max-w-none prose-li:my-0.5 prose-p:my-1 prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-1 prose-strong:font-semibold text-muted-foreground prose-headings:text-foreground">
                    {lines.map((line, index) => {
                        if (/^\s*[-*+]\s/.test(line)) {
                            // Render as list item (prose handles styling)
                            return <li key={index}>{line.replace(/^\s*[-*+]\s/, '')}</li>;
                        } else if (/^#+\s/.test(line)) {
                            // Render headers (adjusting level for nesting, prose handles styling)
                            const level = (line.match(/^#+/) || [''])[0].length;
                            const Tag = `h${Math.min(level + 2, 6)}` as keyof JSX.IntrinsicElements; // Ensure valid heading level
                            return <Tag key={index}>{line.replace(/^#+\s/, '')}</Tag>;
                        } else if (/^(\*\*|__)(.*?)\1/.test(line)) {
                            // Render bold text
                            return <p key={index}><strong>{line.replace(/^(\*\*|__)(.*?)\1/, '$2')}</strong></p>;
                        }
                        // Default to paragraph
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
        ingredientsText: refinedRecipe.refinedIngredients, // Assumes formatted string from AI
        instructionsText: refinedRecipe.refinedInstructions,
        notes: refinedRecipe.feasibilityNotes,
    } : {
        name: recipe.recipeName,
        ingredientsText: formatIngredientsList(recipe.providedIngredients, recipe.additionalIngredients),
        instructionsText: recipe.instructions,
        notes: recipe.notes,
    };

    const handleExplainInstructions = () => {
        if (!displayData.instructionsText || displayData.instructionsText.trim() === T.instructionsUnavailable || displayData.instructionsText.trim() === T.instructionsUnavailablePlaceholder || displayData.instructionsText.trim() === "No instructions applicable.") {
            toast({
                variant: "default",
                title: T.noInstructionsToExplainTitle,
                description: T.noInstructionsToExplainDesc,
            });
            return;
        }

        setExplainError(null);
        setDetailedInstructions(null);

        const input: ExplainInstructionsInput = {
            recipeName: displayData.name || "Recipe",
            originalInstructions: displayData.instructionsText,
            ingredientsList: displayData.ingredientsText || T.ingredientsUnavailable,
            language: languageName // Pass the full language name
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
    const showChecklist = !refinedRecipe && showRefineSection && additionalIngredientsChecklist.length > 0;
    const showAlternatives = !refinedRecipe && alternativeTypes && alternativeTypes.length > 0;
    const instructionsAvailable = displayData.instructionsText && displayData.instructionsText.trim() !== T.instructionsUnavailable && displayData.instructionsText.trim() !== T.instructionsUnavailablePlaceholder && displayData.instructionsText.trim() !== "No instructions applicable.";


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
              <h3 className="font-semibold text-foreground mb-2 flex items-center"><List className="h-4 w-4 mr-2 text-accent"/>{T.ingredientsTitle}</h3>
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
                        disabled={isRefining || isExplaining || isGenerating} // Disable if any action is happening
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

               <div className="text-muted-foreground"> {/* Removed prose here, applying in formatTextToComponent */}
                 {formatTextToComponent(displayData.instructionsText)}
               </div>

                {(isExplaining || explainError || detailedInstructions) && (
                     <Accordion type="single" collapsible className="w-full mt-4" defaultValue={detailedInstructions ? "item-1" : undefined}>
                        <AccordionItem value="item-1">
                             <AccordionTrigger
                                className={`text-primary hover:no-underline text-sm py-2 ${detailedInstructions ? '' : 'cursor-default pointer-events-none'}`} // Prevent click when no content yet
                                disabled={!detailedInstructions} // Disable trigger if no details loaded
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
                                     <div className="text-muted-foreground"> {/* Removed prose here */}
                                        {formatTextToComponent(detailedInstructions)}
                                    </div>
                                ) : null}
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
