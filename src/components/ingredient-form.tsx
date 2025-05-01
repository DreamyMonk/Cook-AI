'use client';

import React from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, ChefHat } from 'lucide-react';

const ingredientFormSchema = z.object({
  ingredients: z.string().min(3, {
    message: 'Please list at least one ingredient.',
  }),
});

export type IngredientFormData = z.infer<typeof ingredientFormSchema>;

interface IngredientFormProps {
  onSubmit: (data: IngredientFormData) => void;
  isGenerating: boolean;
}

export function IngredientForm({ onSubmit, isGenerating }: IngredientFormProps) {
  const form = useForm<IngredientFormData>({
    resolver: zodResolver(ingredientFormSchema),
    defaultValues: {
      ingredients: '',
    },
  });

  const handleFormSubmit: SubmitHandler<IngredientFormData> = (data) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="ingredients"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground font-medium">Available Ingredients</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., chicken breast, broccoli, soy sauce, garlic, rice"
                  className="resize-none min-h-[100px] bg-secondary/50 focus:bg-background focus:ring-accent"
                  {...field}
                  aria-label="Enter available ingredients separated by commas"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
            type="submit"
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 focus:ring-accent"
            disabled={isGenerating}
            aria-live="polite" // Announce changes for screen readers
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <ChefHat className="mr-2 h-4 w-4" />
              Generate Recipe
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
