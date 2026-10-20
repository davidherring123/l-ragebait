import type { DebugPresenter, PlatformAdapter } from '../application/ports';
import type { ClassificationScores, MatchCategory } from '../domain/classification';

const percentage = (score: number): string => `${Math.round(score * 100)}%`;

export class DebugChipController implements DebugPresenter {
  readonly #adapter: PlatformAdapter;
  readonly #chips = new Set<HTMLElement>();
  readonly #chipsByElement = new WeakMap<HTMLElement, HTMLElement>();

  public constructor(adapter: PlatformAdapter) {
    this.#adapter = adapter;
  }

  public showStatus(
    element: HTMLElement,
    status: 'pending' | 'error' | 'no-text',
  ): void {
    const labels = {
      pending: ['L …', 'Waiting for classification'],
      error: ['L !', 'Classification failed; content was kept visible'],
      'no-text': ['L ?', 'No usable title or text was found'],
    } as const;
    const [label, tooltip] = labels[status];
    const chip = this.#getChip(element);
    if (chip === undefined) {
      return;
    }
    chip.textContent = label;
    chip.title = tooltip;
    chip.setAttribute('aria-label', tooltip);
    chip.style.color = status === 'error' ? '#ff6b5f' : '#d4b45f';
  }

  public show(
    element: HTMLElement,
    scores: ClassificationScores,
    threshold: number,
    matchedCategories: readonly MatchCategory[],
    customRule: string | undefined,
  ): void {
    const chip = this.#getChip(element);
    if (chip === undefined) {
      return;
    }
    chip.className = 'l-ragebait-debug-chip';
    const customLabel = scores.custom === null ? '' : ` · C ${percentage(scores.custom)}`;
    chip.textContent = `R ${percentage(scores.ragebait)}${customLabel}`;
    const tooltipLines = [
      'Jev category probabilities (not intensity ratings)',
      `Ragebait: ${percentage(scores.ragebait)}`,
      `Active hide threshold: ${percentage(threshold)}`,
    ];
    if (scores.custom !== null && customRule !== undefined) {
      tooltipLines.push(`Custom rule: ${percentage(scores.custom)}`, customRule);
    }
    tooltipLines.push(
      matchedCategories.length > 0
        ? `Would hide for: ${matchedCategories.join(', ')}`
        : 'Would remain visible at the current settings',
    );
    chip.title = tooltipLines.join('\n');
    chip.setAttribute('aria-label', chip.title);
    chip.style.color = matchedCategories.length > 0 ? '#ff6b5f' : '#8aa675';
  }

  public clear(): void {
    for (const chip of this.#chips) {
      chip.remove();
    }
    this.#chips.clear();
  }

  #getChip(element: HTMLElement): HTMLElement | undefined {
    const anchor = this.#adapter.getDebugAnchor(element);
    if (anchor === undefined) {
      return undefined;
    }
    const chip = this.#chipsByElement.get(element) ?? document.createElement('span');
    chip.className = 'l-ragebait-debug-chip';
    chip.style.display = 'inline-flex';
    chip.style.setProperty('width', 'max-content', 'important');
    chip.style.setProperty('max-width', '100%', 'important');
    chip.style.setProperty('flex', '0 0 auto', 'important');
    chip.style.alignItems = 'center';
    chip.style.alignSelf = 'center';
    chip.style.marginInlineStart = '6px';
    chip.style.padding = '1px 5px';
    chip.style.border = '1px solid currentColor';
    chip.style.borderRadius = '999px';
    chip.style.background = 'rgba(20, 20, 20, 0.88)';
    chip.style.font = '600 10px/16px system-ui, sans-serif';
    chip.style.whiteSpace = 'nowrap';
    chip.style.verticalAlign = 'middle';
    chip.style.cursor = 'help';
    chip.style.zIndex = '2147483647';
    if (!chip.isConnected) {
      anchor.append(chip);
    }
    this.#chips.add(chip);
    this.#chipsByElement.set(element, chip);
    return chip;
  }
}
