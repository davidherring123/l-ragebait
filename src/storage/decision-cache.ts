import { z } from 'zod';

import {
  ClassificationScoresSchema,
  type ClassificationScores,
} from '../domain/classification';

const CACHE_KEY = 'classificationCache';
const MAX_ENTRIES = 2_000;
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1_000;

const cacheEntrySchema = z.object({
  scores: ClassificationScoresSchema,
  createdAt: z.number().int().nonnegative(),
});

const cacheSchema = z.record(z.string(), cacheEntrySchema);
type Cache = z.infer<typeof cacheSchema>;

async function loadCache(): Promise<Cache> {
  const stored = await browser.storage.local.get(CACHE_KEY);
  const result = cacheSchema.safeParse(stored[CACHE_KEY]);
  return result.success ? result.data : {};
}

export async function getCachedScores(key: string): Promise<ClassificationScores | undefined> {
  const cache = await loadCache();
  const entry = cache[key];
  if (entry === undefined) {
    return undefined;
  }
  if (Date.now() - entry.createdAt > MAX_AGE_MS) {
    Reflect.deleteProperty(cache, key);
    await browser.storage.local.set({ [CACHE_KEY]: cache });
    return undefined;
  }
  return entry.scores;
}

export async function cacheScores(key: string, scores: ClassificationScores): Promise<void> {
  const now = Date.now();
  const cache = await loadCache();
  cache[key] = { scores, createdAt: now };

  const retainedEntries = Object.entries(cache)
    .filter(([, entry]) => now - entry.createdAt <= MAX_AGE_MS)
    .sort((left, right) => right[1].createdAt - left[1].createdAt)
    .slice(0, MAX_ENTRIES);

  await browser.storage.local.set({ [CACHE_KEY]: Object.fromEntries(retainedEntries) });
}
