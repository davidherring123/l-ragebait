import { z } from 'zod';

export const categories = ['ragebait', 'inflammatory', 'sensationalized'] as const;

export const CategorySchema = z.enum(categories);
export type Category = z.infer<typeof CategorySchema>;
export const MatchCategorySchema = z.union([CategorySchema, z.literal('custom')]);
export type MatchCategory = z.infer<typeof MatchCategorySchema>;

export const ClassificationScoresSchema = z.object({
  ragebait: z.number().min(0).max(1),
  inflammatory: z.number().min(0).max(1),
  sensationalized: z.number().min(0).max(1),
  custom: z.number().min(0).max(1).nullable(),
});

export type ClassificationScores = z.infer<typeof ClassificationScoresSchema>;

export type CategorySettings = Readonly<Record<Category, boolean>>;

export type ClassificationDecision = Readonly<{
  matchedCategories: readonly MatchCategory[];
  shouldHide: boolean;
}>;

export function decideClassification(
  scores: ClassificationScores,
  enabledCategories: CategorySettings,
  threshold: number,
  customRuleEnabled = false,
): ClassificationDecision {
  const matchedCategories: MatchCategory[] = categories.filter(
    (category) => enabledCategories[category] && scores[category] >= threshold,
  );
  if (customRuleEnabled && scores.custom !== null && scores.custom >= threshold) {
    matchedCategories.push('custom');
  }

  return {
    matchedCategories,
    shouldHide: matchedCategories.length > 0,
  };
}
