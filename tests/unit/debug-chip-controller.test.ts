import { beforeEach, describe, expect, it } from 'vitest';

import type { PlatformAdapter } from '../../src/application/ports';
import { DebugChipController } from '../../src/debug/debug-chip-controller';

const adapter: PlatformAdapter = {
  platform: 'youtube',
  discover: () => [],
  extract: () => undefined,
  getDebugAnchor: (element) => element.querySelector<HTMLElement>('h3') ?? undefined,
};

describe('DebugChipController', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('shows category probabilities and threshold details beside the title', () => {
    const element = document.createElement('article');
    const title = document.createElement('h3');
    title.textContent = 'Example recommendation';
    element.append(title);
    document.body.append(element);
    const controller = new DebugChipController(adapter);

    controller.show(
      element,
      { ragebait: 0.94, inflammatory: 0.74, sensationalized: 0.57, custom: null },
      0.85,
      ['ragebait'],
      undefined,
    );

    const chip = element.querySelector<HTMLElement>('.l-ragebait-debug-chip');
    expect(chip?.textContent).toBe('R 94% · I 74% · S 57%');
    expect(chip?.title).toContain('Active hide threshold: 85%');
    expect(chip?.title).toContain('Would hide for: ragebait');
  });

  it('removes all chips when debug mode is disabled', () => {
    const element = document.createElement('article');
    element.append(document.createElement('h3'));
    document.body.append(element);
    const controller = new DebugChipController(adapter);
    controller.show(
      element,
      { ragebait: 0.1, inflammatory: 0.2, sensationalized: 0.3, custom: null },
      0.85,
      [],
      undefined,
    );

    controller.clear();

    expect(document.querySelector('.l-ragebait-debug-chip')).toBeNull();
  });
});
