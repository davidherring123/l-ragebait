import { beforeEach, describe, expect, it, vi } from 'vitest';

import { defaultSettings } from '../../src/domain/settings';
import { cacheScores, getCachedScores } from '../../src/storage/decision-cache';
import { getSettings, saveSettings } from '../../src/storage/settings-store';
import { getStatistics, incrementStatistics } from '../../src/storage/statistics-store';
import { installBrowserStorage } from '../helpers/browser-storage';

describe('storage boundaries', () => {
  beforeEach(() => {
    vi.useRealTimers();
    installBrowserStorage();
  });

  it('falls back safely when persisted settings are malformed', async () => {
    await browser.storage.local.set({ settings: { enabled: 'yes' } });
    await expect(getSettings()).resolves.toEqual(defaultSettings);
  });

  it('persists and validates settings', async () => {
    const settings = { ...defaultSettings, enabled: false, threshold: 0.91 };
    await saveSettings(settings);
    await expect(getSettings()).resolves.toEqual(settings);
  });

  it('caches scores without raw content and expires stale decisions', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    const scores = { ragebait: 0.9, inflammatory: 0.2, sensationalized: 0.1 };
    await cacheScores('policy:hash', scores);
    await expect(getCachedScores('policy:hash')).resolves.toEqual(scores);

    vi.setSystemTime(new Date('2026-02-02T00:00:00Z'));
    await expect(getCachedScores('policy:hash')).resolves.toBeUndefined();
  });

  it('persists session and lifetime statistics', async () => {
    await expect(incrementStatistics()).resolves.toEqual({ session: 1, lifetime: 1 });
    await expect(getStatistics()).resolves.toEqual({ session: 1, lifetime: 1 });
  });
});
