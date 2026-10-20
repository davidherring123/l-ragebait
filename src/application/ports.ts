import type { ClassificationScores, MatchCategory } from '../domain/classification';
import type { ContentCandidate, Platform } from '../domain/platform';

export type PlatformAdapter = Readonly<{
  platform: Platform;
  discover: (root: ParentNode) => readonly HTMLElement[];
  extract: (element: HTMLElement) => ContentCandidate | undefined;
  getDebugAnchor: (element: HTMLElement) => HTMLElement | undefined;
}>;

export type ContentHasher = (text: string) => Promise<string>;

export type ClassificationProvider = Readonly<{
  classify: (
    text: string,
    apiKey: string,
    customRule: string | undefined,
  ) => Promise<ClassificationScores>;
}>;

export type ScoreCache = Readonly<{
  get: (key: string) => Promise<ClassificationScores | undefined>;
  set: (key: string, scores: ClassificationScores) => Promise<void>;
}>;

export type ContentRemover = Readonly<{
  hide: (
    element: HTMLElement,
    text: string,
    categories: readonly MatchCategory[],
    animationsEnabled: boolean,
  ) => Promise<string>;
}>;

export type DebugPresenter = Readonly<{
  show: (
    element: HTMLElement,
    scores: ClassificationScores,
    threshold: number,
    matchedCategories: readonly MatchCategory[],
    customRule: string | undefined,
  ) => void;
  clear: () => void;
}>;
