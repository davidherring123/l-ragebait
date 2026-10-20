import { z } from 'zod';

export const categories = ['ragebait', 'inflammatory', 'sensationalized'] as const;

export const CategorySchema = z.enum(categories);
export type Category = z.infer<typeof CategorySchema>;

export const ClassificationScoresSchema = z.object({
  ragebait: z.number().min(0).max(1),
  inflammatory: z.number().min(0).max(1),
  sensationalized: z.number().min(0).max(1),
});

export type ClassificationScores = z.infer<typeof ClassificationScoresSchema>;

export type CategorySettings = Readonly<Record<Category, boolean>>;

export type ClassificationDecision = Readonly<{
  matchedCategories: readonly Category[];
  shouldHide: boolean;
}>;

export function decideClassification(
  scores: ClassificationScores,
  enabledCategories: CategorySettings,
  threshold: number,
): ClassificationDecision {
  const matchedCategories = categories.filter(
    (category) => enabledCategories[category] && scores[category] >= threshold,
  );

  return {
    matchedCategories,
    shouldHide: matchedCategories.length > 0,
  };
}
