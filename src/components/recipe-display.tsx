
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
import { Loader2, Sparkles, List, CookingPot, TriangleAlert, CheckSquare, Info, Lightbulb } from 'lucide-react'; // Added Lightbulb
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from "@/hooks/use-toast";


interface RecipeDisplayProps {
  recipe: GenerateRecipeOutput;
  refinedRecipe: RefineRecipeOutput | null;
  alternativeTypes: string[] | null; // New prop for alternative dish types
  onRefine: (unavailableAdditional: string[]) => void;
  onSelectAlternative: (dishType: string) => void; // New prop for selecting an alternative
  isRefining: boolean;
  isGenerating: boolean; // New prop to know if any generation (primary or alternative) is happening
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
    isGenerating // Receive generating state
}: RecipeDisplayProps) {
  const [additionalIngredientsChecklist, setAdditionalIngredientsChecklist] = useState<AdditionalIngredientItem[]>([]);
  const [showRefineSection, setShowRefineSection] = useState(false);
  const [refineError, setRefineError] = useState<string | null>(null);

  const [detailedInstructions, setDetailedInstructions] = useState<string | null>(null);
  const [isExplaining, startExplaining] = useTransition();
  const [explainError, setExplainError] = useState<string | null>(null);
  const { toast } = useToast();


  useEffect(() => {
    setDetailedInstructions(null);
    setExplainError(null);

    if (recipe && !refinedRecipe && recipe.additionalIngredients && recipe.additionalIngredients.length > 0) {
      const initialItems = recipe.additionalIngredients.map((name, index) => ({
        id: `add-ing-${index}-${recipe.recipeName}-${Date.now()}`,
        name: name,
        available: true,
      }));
      setAdditionalIngredientsChecklist(initialItems);
      setShowRefineSection(true);
      setRefineError(null);
    } else {
      setAdditionalIngredientsChecklist([]);
      setShowRefineSection(false);
    }

    if (!refinedRecipe) {
        setRefineError(null);
    }

  }, [recipe, refinedRecipe]);

  const handleAvailabilityChange = (id: string, checked: boolean) => {
    setAdditionalIngredientsChecklist(prev =>
      prev.map(ing =>
        ing.id === id ? { ...ing, available: checked } : ing
      )
    );
     setRefineError(null);
  };

  const handleRefineClick = () => {
    setRefineError(null);
    const unavailable = additionalIngredientsChecklist
      .filter(ing => !ing.available)
      .map(ing => ing.name);

    onRefine(unavailable);
  };

   const formatIngredientsList = (provided: string[] | undefined, additional: string[] | undefined): string => {
       if (!provided && !additional) return "No ingredients listed.";

       const providedItems = provided && provided.length > 0 ? provided : [];
       const additionalItems = additional && additional.length > 0 ? additional : [];
       let formattedString = "";

       if (providedItems.length > 0) {
           formattedString += "**Main Ingredients:**\n" + providedItems.map(item => `- ${item}`).join('\n');
       }
       if (additionalItems.length > 0) {
           if(formattedString) formattedString += "\n\n";
           formattedString += "**Additional Ingredients:**\n" + additionalItems.map(item => `- ${item}`).join('\n');
       }
        if (providedItems.length === 0 && additionalItems.length === 0) {
            formattedString = "Ingredient details not available.";
        }
       return formattedString;
   };

   const formatTextToComponent = (text: string | null | undefined) => {
        if (!text) return <p className="text-muted-foreground italic">Not available.</p>;

        const lines = text.split('\n').map(line => line.trim()).filter(line => line !== '');

        if (lines.length === 0) return <p className="text-muted-foreground italic">Not available.</p>;

        const isNumberedList = lines.length > 1 && lines.every(line => /^\d+[\.\)]\s/.test(line));
        const isMarkdownList = lines.length > 0 && lines.every(line => /^\s*[-*+]\s/.test(line));
        const containsMarkdownFormatting = lines.some(line => /^(#+|\*\*|__)/.test(line));

        if (isNumberedList) {
        return (
            <ol className="list-decimal list-outside space-y-1.5 pl-5">
            {lines.map((line, index) => (
                <li key={index}>{line.replace(/^\d+[\.\)]\s/, '')}</li>
            ))}
            </ol>
        );
        } else if (isMarkdownList || containsMarkdownFormatting) {
            return (
                 <div className="space-y-2 prose prose-sm max-w-none prose-li:my-0.5 prose-p:my-1">
                    {lines.map((line, index) => {
                        if (/^\s*[-*+]\s/.test(line)) {
                            return <li key={index} className="list-disc list-inside ml-4">{line.replace(/^\s*[-*+]\s/, '')}</li>;
                        } else if (/^#+\s/.test(line)) {
                            const level = (line.match(/^#+/) || [''])[0].length;
                            const Tag = `h${level + 2}` as keyof JSX.IntrinsicElements;
                            return <Tag key={index} className="font-semibold mt-3 mb-1">{line.replace(/^#+\s/, '')}</Tag>;
                        } else if (/^(\*\*|__)(.*?)\1/.test(line)) {
                            return <p key={index}><strong>{line.replace(/^(\*\*|__)(.*?)\1/, '$2')}</strong></p>;
                        }
                        return <p key={index}>{line}</p>;
                    })}
                 </div>
            );
        }

        return <div className="space-y-2">{lines.map((line, index) => <p key={index}>{line}</p>)}</div>;
    };

    const displayData = refinedRecipe ? {
        name: refinedRecipe.refinedRecipeName,
        ingredientsText: refinedRecipe.refinedIngredients,
        instructionsText: refinedRecipe.refinedInstructions,
        notes: refinedRecipe.feasibilityNotes,
    } : {
        name: recipe.recipeName,
        ingredientsText: formatIngredientsList(recipe.providedIngredients, recipe.additionalIngredients),
        instructionsText: recipe.instructions,
        notes: recipe.notes,
    };

    const handleExplainInstructions = () => {
        if (!displayData.instructionsText || displayData.instructionsText.trim() === "No instructions applicable." || displayData.instructionsText.trim() === "Instructions unavailable.") {
            toast({
                variant: "default",
                title: "No Instructions",
                description: "There are no instructions available to explain.",
            });
            return;
        }

        setExplainError(null);
        setDetailedInstructions(null);

        const input: ExplainInstructionsInput = {
            recipeName: displayData.name,
            originalInstructions: displayData.instructionsText,
            ingredientsList: displayData.ingredientsText
        };

        startExplaining(async () => {
            try {
                const result = await explainInstructions(input);
                if (result && result.detailedExplanation) {
                    setDetailedInstructions(result.detailedExplanation);
                } else {
                    setExplainError("Could not get a detailed explanation. The AI might be unavailable.");
                    toast({
                        variant: "destructive",
                        title: "Explanation Failed",
                        description: "Failed to get detailed instructions from the AI.",
                    });
                }
            } catch (e) {
                console.error("Error explaining instructions:", e);
                const errorMsg = e instanceof Error ? e.message : "An unknown error occurred.";
                setExplainError(`Failed to get explanation: ${errorMsg}`);
                toast({
                    variant: "destructive",
                    title: "Explanation Error",
                    description: `Could not fetch detailed explanation: ${errorMsg}`,
                });
            }
        });
    };


    // Determine if refinement checklist or alternative types should be shown
    // Checklist: Only if original recipe exists, has additional items, AND no refinement has happened yet.
    const showChecklist = !refinedRecipe && showRefineSection && additionalIngredientsChecklist.length > 0;
    // Alternatives: Only if original recipe exists, alternatives were provided, AND no refinement has happened yet.
    const showAlternatives = !refinedRecipe && alternativeTypes && alternativeTypes.length > 0;


  return (
    <Card className="w-full border-none shadow-none bg-transparent flex flex-col h-full">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="text-xl font-semibold text-primary mb-1">{displayData.name}</CardTitle>
         {displayData.notes && (
            <CardDescription className="text-xs italic mt-1">
                Note: {displayData.notes}
            </CardDescription>
         )}
      </CardHeader>

       <ScrollArea className="flex-grow pr-3">
         <CardContent className="p-0 space-y-4 text-sm ">
            {/* Ingredients Section */}
            <div>
              <h3 className="font-semibold text-foreground mb-2 flex items-center"><List className="h-4 w-4 mr-2 text-accent"/>Ingredients</h3>
               {formatTextToComponent(displayData.ingredientsText)}
            </div>

             {/* Alternative Dish Types Section */}
             {showAlternatives && (
                 <>
                 <Separator className="my-3"/>
                 <div className="space-y-3 rounded-md border border-dashed border-border p-3 bg-secondary/20">
                      <h3 className="font-semibold text-foreground flex items-center text-base">
                          <Lightbulb className="h-5 w-5 mr-2 text-accent"/> Alternative Ideas
                      </h3>
                      <p className="text-xs text-muted-foreground">
                          These ingredients could also make other types of dishes. Click one to generate a different recipe:
                      </p>
                      <div className="flex flex-wrap gap-2">
                         {alternativeTypes.map((type) => (
                            <Button
                                key={type}
                                variant="outline"
                                size="sm"
                                onClick={() => onSelectAlternative(type)}
                                // Disable if any generation or refinement is in progress
                                disabled={isGenerating || isRefining || isExplaining}
                                className="border-primary text-primary hover:bg-primary/10 text-xs h-7 px-2"
                                aria-live="polite"
                            >
                                {isGenerating ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                                Try {type}
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
                         <CheckSquare className="h-5 w-5 mr-2 text-accent"/> Review Additional Items
                     </h3>
                     <p className="text-xs text-muted-foreground">
                         The chef suggested these extra items. Uncheck any you don't have, then click "Refine Recipe".
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
                            <AlertTitle className="text-xs font-medium">Refinement Info</AlertTitle>
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
                            Refining...
                            </>
                        ) : (
                            <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Refine Recipe
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
                   <h3 className="font-semibold text-foreground flex items-center"><CookingPot className="h-4 w-4 mr-2 text-accent"/>Instructions</h3>
                    {!detailedInstructions && (displayData.instructionsText && displayData.instructionsText.trim() !== "No instructions applicable." && displayData.instructionsText.trim() !== "Instructions unavailable.") && (
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
                             Explain Steps
                        </Button>
                    )}
               </div>

               <div className="text-muted-foreground space-y-2 prose prose-sm max-w-none prose-li:my-0.5 prose-p:my-1">
                 {formatTextToComponent(displayData.instructionsText)}
               </div>

                {(isExplaining || explainError || detailedInstructions) && (
                     <Accordion type="single" collapsible className="w-full mt-4" defaultValue={detailedInstructions ? "item-1" : undefined}>
                        <AccordionItem value="item-1">
                             <AccordionTrigger
                                className={`text-primary hover:no-underline text-sm py-2 ${detailedInstructions ? '' : 'cursor-default'}`}
                                disabled={!detailedInstructions}
                             >
                                {isExplaining ? (
                                    <span className="flex items-center"><Loader2 className="h-4 w-4 animate-spin mr-2" />Fetching Details...</span>
                                ) : explainError ? (
                                    <span className="flex items-center text-destructive"><TriangleAlert className="h-4 w-4 mr-2" />Explanation Error</span>
                                ) : (
                                     <span className="flex items-center"><Info className="h-4 w-4 mr-2" />View Detailed Explanation</span>
                                )}
                             </AccordionTrigger>
                            <AccordionContent className="pt-2 pb-0">
                                {isExplaining ? (
                                    <div className="flex items-center text-muted-foreground">
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading explanation...
                                    </div>
                                ) : explainError ? (
                                    <Alert variant="destructive" className="text-xs">
                                        <TriangleAlert className="h-3 w-3" />
                                        <AlertTitle className="text-xs font-medium">Error</AlertTitle>
                                        <AlertDescription className="text-xs">{explainError}</AlertDescription>
                                    </Alert>
                                ) : detailedInstructions ? (
                                     <div className="text-muted-foreground space-y-2 prose prose-sm max-w-none prose-li:my-0.5 prose-p:my-1">
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
