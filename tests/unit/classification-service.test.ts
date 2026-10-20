import { describe, expect, it, vi } from 'vitest';

import { ClassificationService } from '../../src/application/classification-service';
import type { ClassificationScores } from '../../src/domain/classification';

const scores: ClassificationScores = {
  ragebait: 0.9,
  inflammatory: 0.2,
  sensationalized: 0.1,
};

describe('ClassificationService', () => {
  it('deduplicates concurrent provider requests', async () => {
    const providerResult = Promise.withResolvers<ClassificationScores>();
    const classify = vi.fn(async (): Promise<ClassificationScores> => {
      await Promise.resolve();
      return providerResult.promise;
    });
    const cache = {
      get: vi.fn(async (): Promise<ClassificationScores | undefined> => {
        await Promise.resolve();
        return undefined;
      }),
      set: vi.fn(async (): Promise<void> => {
        await Promise.resolve();
      }),
    };
    const service = new ClassificationService({ classify }, cache, 'policy-1');

    const first = service.classify('same-hash', 'same text', 'key');
    const second = service.classify('same-hash', 'same text', 'key');
    await vi.waitFor(() => {
      expect(classify).toHaveBeenCalledOnce();
    });
    providerResult.resolve(scores);

    await expect(Promise.all([first, second])).resolves.toEqual([scores, scores]);
    expect(classify).toHaveBeenCalledOnce();
    expect(cache.set).toHaveBeenCalledOnce();
  });

  it('uses cached scores without calling the provider', async () => {
    const classify = vi.fn(async (): Promise<ClassificationScores> => {
      await Promise.resolve();
      return scores;
    });
    const cache = {
      get: vi.fn(async (): Promise<ClassificationScores> => {
        await Promise.resolve();
        return scores;
      }),
      set: vi.fn(async (): Promise<void> => {
        await Promise.resolve();
      }),
    };
    const service = new ClassificationService({ classify }, cache, 'policy-1');

    await expect(service.classify('hash', 'text', 'key')).resolves.toEqual(scores);
    expect(classify).not.toHaveBeenCalled();
  });
});
