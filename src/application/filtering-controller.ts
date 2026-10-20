import type { ContentCandidate } from '../domain/platform';
import type { Settings } from '../domain/settings';
import { ClassificationResponseSchema } from '../messaging/schemas';
import { ClassificationQueue } from './classification-queue';
import type { ContentHasher, ContentRemover, PlatformAdapter } from './ports';

export class FilteringController {
  readonly #adapter: PlatformAdapter;
  readonly #remover: ContentRemover;
  readonly #hash: ContentHasher;
  readonly #queue: ClassificationQueue;
  readonly #observed = new WeakSet<HTMLElement>();
  readonly #processed = new WeakSet<HTMLElement>();
  readonly #intersectionObserver: IntersectionObserver;
  #mutationObserver: MutationObserver | undefined;
  #settings: Settings;

  public constructor(
    adapter: PlatformAdapter,
    remover: ContentRemover,
    hash: ContentHasher,
    settings: Settings,
  ) {
    this.#adapter = adapter;
    this.#remover = remover;
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
    this.#discover(document);
  }

  public stop(): void {
    this.#mutationObserver?.disconnect();
    this.#intersectionObserver.disconnect();
  }

  #discover(root: ParentNode): void {
    if (!this.#isEnabled()) {
      return;
    }
    for (const element of this.#adapter.discover(root)) {
      if (!this.#observed.has(element) && !this.#processed.has(element)) {
        this.#observed.add(element);
        this.#intersectionObserver.observe(element);
      }
    }
  }

  #queueCandidate(element: HTMLElement): void {
    if (this.#processed.has(element) || !this.#isEnabled()) {
      return;
    }
    const candidate = this.#adapter.extract(element);
    if (candidate === undefined) {
      return;
    }
    this.#processed.add(element);
    this.#queue.enqueue(async () => this.#process(candidate));
  }

  async #process(candidate: ContentCandidate): Promise<void> {
    const hash = await this.#hash(candidate.text);
    const response: unknown = await browser.runtime.sendMessage({
      type: 'classify',
      hash,
      text: candidate.text,
      platform: candidate.platform,
    });
    const result = ClassificationResponseSchema.safeParse(response);
    if (!result.success || !result.data.ok || !result.data.shouldHide || !candidate.element.isConnected) {
      return;
    }

    const currentCandidate = this.#adapter.extract(candidate.element);
    if (currentCandidate === undefined || (await this.#hash(currentCandidate.text)) !== hash) {
      this.#processed.delete(candidate.element);
      this.#discover(candidate.element);
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
