import { z } from 'zod';

import { CategorySchema, ClassificationScoresSchema } from '../domain/classification';
import { PlatformSchema } from '../domain/platform';
import { SettingsSchema } from '../domain/settings';
import { StatisticsSchema } from '../domain/statistics';

export const BackgroundRequestSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('classify'), hash: z.string().regex(/^[a-f0-9]{64}$/u), text: z.string().min(1).max(12_000), platform: PlatformSchema }),
  z.object({ type: z.literal('getExtensionState') }),
  z.object({ type: z.literal('getContentSettings') }),
  z.object({ type: z.literal('saveSettings'), settings: SettingsSchema }),
  z.object({ type: z.literal('saveApiKey'), apiKey: z.string().trim().max(500) }),
  z.object({ type: z.literal('recordHidden') }),
]);

export type BackgroundRequest = z.infer<typeof BackgroundRequestSchema>;

export const ClassificationResponseSchema = z.discriminatedUnion('ok', [
  z.object({
    ok: z.literal(true),
    scores: ClassificationScoresSchema,
    matchedCategories: z.array(CategorySchema),
    shouldHide: z.boolean(),
  }),
  z.object({ ok: z.literal(false) }),
]);

export const ExtensionStateSchema = z.object({
  settings: SettingsSchema,
  statistics: StatisticsSchema,
  hasApiKey: z.boolean(),
});

export const ContentRequestSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('settingsChanged'), settings: SettingsSchema }),
  z.object({ type: z.literal('getHiddenItems') }),
  z.object({ type: z.literal('getDiagnostics') }),
  z.object({ type: z.literal('restoreHiddenItem'), id: z.string().min(1) }),
]);

export const RecentHiddenItemSchema = z.object({
  id: z.string().min(1),
  excerpt: z.string(),
  categories: z.array(CategorySchema),
});

export const RecentHiddenItemsSchema = z.array(RecentHiddenItemSchema);
export type RecentHiddenItem = z.infer<typeof RecentHiddenItemSchema>;

export const SuccessResponseSchema = z.object({ ok: z.boolean() });
