import type { ClassificationScores } from '../domain/classification';
import type { ClassificationProvider, ScoreCache } from './ports';

export class ClassificationService {
  readonly #provider: ClassificationProvider;
  readonly #cache: ScoreCache;
  readonly #policyVersion: string;
  readonly #inFlight = new Map<string, Promise<ClassificationScores>>();

  public constructor(
    provider: ClassificationProvider,
    cache: ScoreCache,
    policyVersion: string,
  ) {
    this.#provider = provider;
    this.#cache = cache;
    this.#policyVersion = policyVersion;
  }

  public async classify(hash: string, text: string, apiKey: string): Promise<ClassificationScores> {
    const key = `${this.#policyVersion}:${hash}`;
    const cached = await this.#cache.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const existing = this.#inFlight.get(key);
    if (existing !== undefined) {
      return existing;
    }

    const request = this.#provider.classify(text, apiKey).then(async (scores) => {
      await this.#cache.set(key, scores);
      return scores;
    });
    this.#inFlight.set(key, request);
    try {
      return await request;
    } finally {
      this.#inFlight.delete(key);
    }
  }
}
