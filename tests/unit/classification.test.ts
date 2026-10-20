import { describe, expect, it } from 'vitest';

import { decideClassification } from '../../src/domain/classification';

const allEnabled = { ragebait: true, inflammatory: true, sensationalized: true };

describe('decideClassification', () => {
  it('hides at the configured threshold and reports only matching categories', () => {
    const decision = decideClassification(
      { ragebait: 0.85, inflammatory: 0.3, sensationalized: 0.91 },
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
      { ragebait: 0.14, inflammatory: 0.09, sensationalized: 0.28 },
      allEnabled,
      0.85,
    );

    expect(decision.shouldHide).toBe(false);
  });

  it('does not match a disabled category', () => {
    const decision = decideClassification(
      { ragebait: 0.99, inflammatory: 0.1, sensationalized: 0.1 },
      { ...allEnabled, ragebait: false },
      0.85,
    );

    expect(decision.shouldHide).toBe(false);
  });
});
