import type { Category, ClassificationScores } from '../domain/classification';
import type { ContentCandidate, Platform } from '../domain/platform';

export type PlatformAdapter = Readonly<{
  platform: Platform;
  discover: (root: ParentNode) => readonly HTMLElement[];
  extract: (element: HTMLElement) => ContentCandidate | undefined;
}>;

export type ContentHasher = (text: string) => Promise<string>;

export type ClassificationProvider = Readonly<{
  classify: (text: string, apiKey: string) => Promise<ClassificationScores>;
}>;

export type ScoreCache = Readonly<{
  get: (key: string) => Promise<ClassificationScores | undefined>;
  set: (key: string, scores: ClassificationScores) => Promise<void>;
}>;

export type ContentRemover = Readonly<{
  hide: (
    element: HTMLElement,
    text: string,
    categories: readonly Category[],
    animationsEnabled: boolean,
  ) => Promise<string>;
}>;
