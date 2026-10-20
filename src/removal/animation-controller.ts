import type { MatchCategory } from '../domain/classification';
import { HiddenItemRegistry } from './hidden-item-registry';

const ANIMATION_DURATION_MS = 300;

type AnimateElement = (
  element: HTMLElement,
  keyframes: Keyframe[],
  options: KeyframeAnimationOptions,
) => Readonly<{ finished: Promise<unknown> }>;

export class AnimationController {
  readonly #registry: HiddenItemRegistry;
  readonly #animate: AnimateElement;

  public constructor(
    registry: HiddenItemRegistry,
    animate: AnimateElement = (element, keyframes, options) => element.animate(keyframes, options),
  ) {
    this.#registry = registry;
    this.#animate = animate;
  }

  public async hide(
    element: HTMLElement,
    text: string,
    categories: readonly MatchCategory[],
    animationsEnabled: boolean,
  ): Promise<string> {
    const originalStyle = element.getAttribute('style');
    const reduceMotion = animationsEnabled && matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (animationsEnabled && !reduceMotion) {
      const box = element.getBoundingClientRect();
      const animation = this.#animate(
        element,
        [
          { opacity: 1, transform: 'scale(1)', filter: 'blur(0)', height: `${box.height}px` },
          { opacity: 0, transform: 'scale(0.97)', filter: 'blur(2px)', height: '0px', marginBlock: '0px', paddingBlock: '0px' },
        ],
        { duration: ANIMATION_DURATION_MS, easing: 'ease-in-out', fill: 'forwards' },
      );
      await animation.finished.catch(() => undefined);
    }

    element.style.display = 'none';
    return this.#registry.add(element, originalStyle, text, categories);
  }
}
