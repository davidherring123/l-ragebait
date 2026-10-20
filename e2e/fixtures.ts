import { chromium, test as base, type BrowserContext } from '@playwright/test';
import path from 'node:path';

const extensionPath = path.resolve('.output/chrome-mv3');

export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
}>({
  context: async ({ browserName: _browserName }, use) => {
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });
    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    const worker = context.serviceWorkers().at(0) ?? await context.waitForEvent('serviceworker');
    const extensionId = worker.url().split('/').at(2);
    if (extensionId === undefined) {
      throw new Error('Could not determine the extension ID.');
    }
    await use(extensionId);
  },
});

export const expect = test.expect;
