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

  public show(
    element: HTMLElement,
    scores: ClassificationScores,
    threshold: number,
    matchedCategories: readonly MatchCategory[],
    customRule: string | undefined,
  ): void {
    const anchor = this.#adapter.getDebugAnchor(element);
    if (anchor === undefined) {
      return;
    }

    const chip = this.#chipsByElement.get(element) ?? document.createElement('span');
    chip.className = 'l-ragebait-debug-chip';
    const customLabel = scores.custom === null ? '' : ` · C ${percentage(scores.custom)}`;
    chip.textContent = `R ${percentage(scores.ragebait)} · I ${percentage(scores.inflammatory)} · S ${percentage(scores.sensationalized)}${customLabel}`;
    const tooltipLines = [
      'Jev category probabilities (not intensity ratings)',
      `Ragebait: ${percentage(scores.ragebait)}`,
      `Inflammatory discussion: ${percentage(scores.inflammatory)}`,
      `Sensationalized tragedy: ${percentage(scores.sensationalized)}`,
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
    chip.style.display = 'inline-flex';
    chip.style.alignItems = 'center';
    chip.style.marginInlineStart = '6px';
    chip.style.padding = '1px 5px';
    chip.style.border = '1px solid currentColor';
    chip.style.borderRadius = '999px';
    chip.style.color = matchedCategories.length > 0 ? '#ff6b5f' : '#8aa675';
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
  }

  public clear(): void {
    for (const chip of this.#chips) {
      chip.remove();
    }
    this.#chips.clear();
  }
}
