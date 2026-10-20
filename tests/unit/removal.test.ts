import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AnimationController } from '../../src/removal/animation-controller';
import { HiddenItemRegistry } from '../../src/removal/hidden-item-registry';

describe('content removal', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('instantly hides and restores an item without leaving a placeholder', async () => {
    const element = document.createElement('article');
    element.style.color = 'red';
    document.body.append(element);
    const registry = new HiddenItemRegistry();
    const controller = new AnimationController(registry);

    const id = await controller.hide(element, 'Provocative example content', ['ragebait'], false);

    expect(element.style.display).toBe('none');
    expect(registry.list()).toHaveLength(1);
    expect(registry.restore(id)).toBe(true);
    expect(element.style.color).toBe('red');
    expect(element.style.display).toBe('');
  });

  it('uses animation when motion is allowed', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    const element = document.createElement('article');
    document.body.append(element);
    const animate = vi.fn(() => ({ finished: Promise.resolve() }));
    const controller = new AnimationController(new HiddenItemRegistry(), animate);

    await controller.hide(element, 'Inflammatory example content', ['ragebait'], true);

    expect(animate).toHaveBeenCalledOnce();
    expect(element.style.display).toBe('none');
  });
});
