import { describe, expect, it } from 'vitest';

import { decideClassification } from '../../src/domain/classification';

const allEnabled = { ragebait: true };

describe('decideClassification', () => {
  it('hides at the configured threshold and reports only matching categories', () => {
    const decision = decideClassification(
      { ragebait: 0.85, custom: null },
      allEnabled,
      0.85,
    );

    expect(decision).toEqual({
      shouldHide: true,
      matchedCategories: ['ragebait'],
    });
  });

  it('keeps likely neutral reporting visible', () => {
    const decision = decideClassification(
      { ragebait: 0.14, custom: null },
      allEnabled,
      0.85,
    );

    expect(decision.shouldHide).toBe(false);
  });

  it('does not match a disabled category', () => {
    const decision = decideClassification(
      { ragebait: 0.99, custom: null },
      { ...allEnabled, ragebait: false },
      0.85,
    );

    expect(decision.shouldHide).toBe(false);
  });

  it('matches an enabled custom rule independently', () => {
    const decision = decideClassification(
      { ragebait: 0.1, custom: 0.9 },
      allEnabled,
      0.85,
      true,
    );

    expect(decision).toEqual({ shouldHide: true, matchedCategories: ['custom'] });
  });
});
