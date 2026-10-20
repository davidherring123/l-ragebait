import type { ContentCandidate } from '../domain/platform';
import type { Settings } from '../domain/settings';
import { ClassificationResponseSchema } from '../messaging/schemas';
import { ClassificationQueue } from './classification-queue';
import type { ContentHasher, ContentRemover, DebugPresenter, PlatformAdapter } from './ports';

export class FilteringController {
  readonly #adapter: PlatformAdapter;
  readonly #remover: ContentRemover;
  readonly #debugPresenter: DebugPresenter;
  readonly #hash: ContentHasher;
  readonly #queue: ClassificationQueue;
  readonly #observed = new WeakSet<HTMLElement>();
  readonly #processedGeneration = new WeakMap<HTMLElement, number>();
  readonly #intersectionObserver: IntersectionObserver;
  #mutationObserver: MutationObserver | undefined;
  #settings: Settings;
  #settingsGeneration = 0;
  #discoveredCount = 0;
  #queuedCount = 0;
  #requestCount = 0;

  public constructor(
    adapter: PlatformAdapter,
    remover: ContentRemover,
    debugPresenter: DebugPresenter,
    hash: ContentHasher,
    settings: Settings,
  ) {
    this.#adapter = adapter;
    this.#remover = remover;
    this.#debugPresenter = debugPresenter;
    this.#hash = hash;
    this.#settings = settings;
    this.#queue = new ClassificationQueue(2, (error) => {
      console.warn('L Ragebait classification task failed.', error);
    });
    this.#intersectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.target instanceof HTMLElement) {
            this.#intersectionObserver.unobserve(entry.target);
            this.#observed.delete(entry.target);
            this.#queueCandidate(entry.target);
          }
        }
      },
      { rootMargin: '800px 0px' },
    );
  }

  public start(): void {
    this.#discover(document);
    this.#mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLElement) {
            this.#discover(node);
          }
        }
      }
    });
    this.#mutationObserver.observe(document.documentElement, { childList: true, subtree: true });
  }

  public updateSettings(settings: Settings): void {
    this.#settings = settings;
    this.#settingsGeneration += 1;
    if (!settings.debugMode) {
      this.#debugPresenter.clear();
    }
    this.#discover(document);
  }

  public stop(): void {
    this.#mutationObserver?.disconnect();
    this.#intersectionObserver.disconnect();
  }

  public getDiagnostics(): Readonly<{
    discoveredCount: number;
    queuedCount: number;
    requestCount: number;
    enabled: boolean;
  }> {
    return {
      discoveredCount: this.#discoveredCount,
      queuedCount: this.#queuedCount,
      requestCount: this.#requestCount,
      enabled: this.#isEnabled(),
    };
  }

  #discover(root: ParentNode): void {
    if (!this.#isEnabled()) {
      return;
    }
    for (const element of this.#adapter.discover(root)) {
      const processedForCurrentSettings =
        this.#processedGeneration.get(element) === this.#settingsGeneration;
      if (
        element.style.display !== 'none'
        && !this.#observed.has(element)
        && !processedForCurrentSettings
      ) {
        this.#discoveredCount += 1;
        this.#observed.add(element);
        this.#intersectionObserver.observe(element);
      }
    }
  }

  #queueCandidate(element: HTMLElement): void {
    const generation = this.#settingsGeneration;
    if (this.#processedGeneration.get(element) === generation || !this.#isEnabled()) {
      return;
    }
    const candidate = this.#adapter.extract(element);
    if (candidate === undefined) {
      return;
    }
    this.#processedGeneration.set(element, generation);
    this.#queuedCount += 1;
    this.#queue.enqueue(async () => this.#process(candidate, generation));
  }

  async #process(candidate: ContentCandidate, generation: number): Promise<void> {
    const hash = await this.#hash(candidate.text);
    this.#requestCount += 1;
    const response: unknown = await browser.runtime.sendMessage({
      type: 'classify',
      hash,
      text: candidate.text,
      platform: candidate.platform,
    });
    const result = ClassificationResponseSchema.safeParse(response);
    if (
      generation !== this.#settingsGeneration
      || !result.success
      || !result.data.ok
      || !candidate.element.isConnected
      || candidate.element.style.display === 'none'
    ) {
      return;
    }

    const currentCandidate = this.#adapter.extract(candidate.element);
    if (currentCandidate === undefined || (await this.#hash(currentCandidate.text)) !== hash) {
      if (this.#processedGeneration.get(candidate.element) === generation) {
        this.#processedGeneration.delete(candidate.element);
      }
      this.#discover(candidate.element);
      return;
    }

    if (this.#settings.debugMode) {
      this.#debugPresenter.show(
        candidate.element,
        result.data.scores,
        this.#settings.threshold,
        result.data.matchedCategories,
      );
      return;
    }

    if (!result.data.shouldHide) {
      return;
    }

    await this.#remover.hide(
      candidate.element,
      candidate.text,
      result.data.matchedCategories,
      this.#settings.animations,
    );
    const recordResponse: unknown = await browser.runtime.sendMessage({ type: 'recordHidden' });
    if (typeof recordResponse !== 'object' || recordResponse === null) {
      console.warn('L Ragebait could not record a filtered item.');
    }
  }

  #isEnabled(): boolean {
    return this.#settings.enabled && this.#settings.platforms[this.#adapter.platform];
  }
}
