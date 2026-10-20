import { emptyStatistics, StatisticsSchema, type Statistics } from '../domain/statistics';

const LIFETIME_KEY = 'lifetimeFilteredCount';
const SESSION_KEY = 'sessionFilteredCount';

async function getCount(area: Browser.storage.StorageArea, key: string): Promise<number> {
  const stored = await area.get(key);
  const result = StatisticsSchema.shape.session.safeParse(stored[key]);
  return result.success ? result.data : 0;
}

export async function getStatistics(): Promise<Statistics> {
  const [session, lifetime] = await Promise.all([
    getCount(browser.storage.session, SESSION_KEY),
    getCount(browser.storage.local, LIFETIME_KEY),
  ]);
  return { session, lifetime };
}

export async function incrementStatistics(): Promise<Statistics> {
  const previous = await getStatistics();
  const next: Statistics = {
    session: previous.session + 1,
    lifetime: previous.lifetime + 1,
  };
  await Promise.all([
    browser.storage.session.set({ [SESSION_KEY]: next.session }),
    browser.storage.local.set({ [LIFETIME_KEY]: next.lifetime }),
  ]);
  return next;
}

export async function initializeStatistics(): Promise<void> {
  const current = await getStatistics();
  if (current.session === emptyStatistics.session) {
    await browser.storage.session.set({ [SESSION_KEY]: emptyStatistics.session });
  }
}
