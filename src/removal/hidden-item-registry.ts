import type { MatchCategory } from '../domain/classification';
import type { RecentHiddenItem } from '../messaging/schemas';

type HiddenRecord = Readonly<{
  element: HTMLElement;
  originalStyle: string | null;
  item: RecentHiddenItem;
}>;

const MAX_RECENT_ITEMS = 50;

export class HiddenItemRegistry {
  readonly #records = new Map<string, HiddenRecord>();

  public add(
    element: HTMLElement,
    originalStyle: string | null,
    text: string,
    categories: readonly MatchCategory[],
  ): string {
    const id = crypto.randomUUID();
    const excerpt = text.replaceAll(/\s+/gu, ' ').trim().slice(0, 120);
    this.#records.set(id, {
      element,
      originalStyle,
      item: { id, excerpt, categories: [...categories] },
    });

    while (this.#records.size > MAX_RECENT_ITEMS) {
      const oldestId = this.#records.keys().next().value;
      if (oldestId === undefined) {
        break;
      }
      this.#records.delete(oldestId);
    }
    return id;
  }

  public list(): readonly RecentHiddenItem[] {
    return [...this.#records.values()].toReversed().map((record) => record.item);
  }

  public restore(id: string): boolean {
    const record = this.#records.get(id);
    if (!record?.element.isConnected) {
      this.#records.delete(id);
      return false;
    }

    if (record.originalStyle === null) {
      record.element.removeAttribute('style');
    } else {
      record.element.setAttribute('style', record.originalStyle);
    }
    this.#records.delete(id);
    return true;
  }
}
