import { afterEach, describe, expect, it, vi } from 'vitest';

import { FilteringController } from '../../src/application/filtering-controller';
import type { PlatformAdapter } from '../../src/application/ports';
import { defaultSettings } from '../../src/domain/settings';

class ImmediateIntersectionObserver implements IntersectionObserver {
  public readonly root = null;
  public readonly rootMargin = '0px';
  public readonly thresholds = [0];
  readonly #callback: IntersectionObserverCallback;

  public constructor(callback: IntersectionObserverCallback) {
    this.#callback = callback;
  }

  public disconnect(): void {
    // Test observer has no retained targets.
  }

  public observe(target: Element): void {
    this.#callback([
      {
        boundingClientRect: new DOMRect(),
        intersectionRatio: 1,
        intersectionRect: new DOMRect(),
        isIntersecting: true,
        rootBounds: null,
        target,
        time: performance.now(),
      },
    ], this);
  }

  public takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  public unobserve(_target: Element): void {
    // Test observer invokes callbacks immediately.
  }
}

const adapter: PlatformAdapter = {
  platform: 'x',
  discover: (root) => {
    const matches = [...root.querySelectorAll<HTMLElement>('.candidate')];
    if (root instanceof HTMLElement && root.matches('.candidate')) {
      matches.unshift(root);
    }
    return matches;
  },
  extract: (element) => ({ element, platform: 'x', text: element.textContent }),
};

async function settle(): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 20);
  });
}

describe('FilteringController', () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.unstubAllGlobals();
  });

  it('discovers dynamically inserted content and removes a confident match once', async () => {
    vi.stubGlobal('IntersectionObserver', ImmediateIntersectionObserver);
    const sendMessage = vi.fn(async (_message: unknown): Promise<unknown> => {
      await Promise.resolve();
      return {
        ok: true,
        scores: { ragebait: 0.99, inflammatory: 0.1, sensationalized: 0.1 },
        matchedCategories: ['ragebait'],
        shouldHide: true,
      };
    });
    vi.stubGlobal('browser', { runtime: { sendMessage } });
    const hide = vi.fn(async (): Promise<string> => {
      await Promise.resolve();
      return 'hidden-id';
    });
    const controller = new FilteringController(
      adapter,
      { hide },
      async () => {
        await Promise.resolve();
        return 'a'.repeat(64);
      },
      defaultSettings,
    );
    controller.start();

    const candidate = document.createElement('article');
    candidate.className = 'candidate';
    candidate.textContent = 'A dynamically inserted ragebait example.';
    document.body.append(candidate);
    await settle();

    expect(hide).toHaveBeenCalledOnce();
    expect(sendMessage).toHaveBeenCalledTimes(2);
    controller.stop();
  });

  it('fails open when classification fails', async () => {
    vi.stubGlobal('IntersectionObserver', ImmediateIntersectionObserver);
    const sendMessage = vi.fn(async (): Promise<unknown> => {
      await Promise.resolve();
      return { ok: false };
    });
    vi.stubGlobal('browser', { runtime: { sendMessage } });
    const hide = vi.fn(async (): Promise<string> => {
      await Promise.resolve();
      return 'hidden-id';
    });
    const controller = new FilteringController(
      adapter,
      { hide },
      async () => {
        await Promise.resolve();
        return 'a'.repeat(64);
      },
      defaultSettings,
    );

    const candidate = document.createElement('article');
    candidate.className = 'candidate';
    candidate.textContent = 'Content that must remain visible after an API failure.';
    document.body.append(candidate);
    controller.start();
    await settle();

    expect(hide).not.toHaveBeenCalled();
    expect(sendMessage).toHaveBeenCalledOnce();
    expect(candidate.isConnected).toBe(true);
    controller.stop();
  });
});
