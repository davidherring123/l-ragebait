import { describe, expect, it } from 'vitest';

import { decideClassification } from '../../src/domain/classification';

const allEnabled = { ragebait: true, inflammatory: true, sensationalized: true };

describe('decideClassification', () => {
  it('hides at the configured threshold and reports only matching categories', () => {
    const decision = decideClassification(
      { ragebait: 0.85, inflammatory: 0.3, sensationalized: 0.91, custom: null },
      allEnabled,
      0.85,
    );

    expect(decision).toEqual({
      shouldHide: true,
      matchedCategories: ['ragebait', 'sensationalized'],
    });
  });

  it('keeps likely neutral reporting visible', () => {
    const decision = decideClassification(
      { ragebait: 0.14, inflammatory: 0.09, sensationalized: 0.28, custom: null },
      allEnabled,
      0.85,
    );

    expect(decision.shouldHide).toBe(false);
  });

  it('does not match a disabled category', () => {
    const decision = decideClassification(
      { ragebait: 0.99, inflammatory: 0.1, sensationalized: 0.1, custom: null },
      { ...allEnabled, ragebait: false },
      0.85,
    );

    expect(decision.shouldHide).toBe(false);
  });

  it('matches an enabled custom rule independently', () => {
    const decision = decideClassification(
      { ragebait: 0.1, inflammatory: 0.1, sensationalized: 0.1, custom: 0.9 },
      allEnabled,
      0.85,
      true,
    );

    expect(decision).toEqual({ shouldHide: true, matchedCategories: ['custom'] });
  });
});
