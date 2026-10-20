import { expect, test } from './fixtures';

test('classifies a YouTube recommendation and shows debug scores', async ({ context, page, extensionId }) => {
  let jevRequestCount = 0;
  let observedJevRequestCount = 0;
  const worker = context.serviceWorkers().at(0);
  if (worker === undefined) {
    throw new Error('Extension service worker is unavailable.');
  }
  context.on('request', (request) => {
    if (request.url().startsWith('https://api.typesafe.ai/')) {
      observedJevRequestCount += 1;
    }
  });
  await context.route('https://api.typesafe.ai/**', async (route) => {
    jevRequestCount += 1;
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        model: 'jev-1.13.0',
        answers: {
          ragebait: { type: 'noul', noul: 0.29 },
          custom: { type: 'noul', noul: 0.36 },
        },
      }),
    });
  });
  await context.route('https://www.youtube.com/**', async (route) => {
    await route.fulfill({
      contentType: 'text/html',
      body: `<!doctype html>
        <html><body>
          <ytd-rich-item-renderer style="display:block;width:400px;height:200px">
            <a id="video-title">Everyone is furious and you should be too</a>
            <div id="channel-name">Outrage Channel</div>
            <div id="metadata-line">500K views</div>
          </ytd-rich-item-renderer>
        </body></html>`,
    });
  });

  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  await popup.getByPlaceholder('Paste a Jev API key').fill('test-key-not-real');
  await popup.getByRole('button', { name: 'Save' }).click();
  await expect(popup.getByText('API key saved')).toBeVisible();
  await popup.getByLabel('Show classification scores').check();
  await popup.getByLabel('Enable custom rule').check();
  await popup.getByLabel('Hide content when…').fill('This content tries to provoke arguments about gaming.');
  await popup.getByLabel('Hide content when…').blur();
  await popup.reload();
  await expect(popup.getByLabel('Show classification scores')).toBeChecked();
  await expect(popup.getByLabel('Enable custom rule')).toBeChecked();

  await page.goto('https://www.youtube.com/');
  const recommendation = page.locator('ytd-rich-item-renderer');
  await page.waitForTimeout(1_000);
  const contentStatus = await worker.evaluate(async (): Promise<unknown> => {
    const tabs = await chrome.tabs.query({ url: 'https://www.youtube.com/*' });
    const tabId = tabs.at(0)?.id;
    if (tabId === undefined) {
      return { error: 'tab unavailable', tabs };
    }
    try {
      const response: unknown = await chrome.tabs.sendMessage(tabId, { type: 'getHiddenItems' });
      const diagnostics: unknown = await chrome.tabs.sendMessage(tabId, { type: 'getDiagnostics' });
      return { diagnostics, response, responseIsArray: Array.isArray(response), tabs };
    } catch (error: unknown) {
      return { error: String(error), tabs };
    }
  });
  expect(contentStatus).toMatchObject({ responseIsArray: true });
  expect(contentStatus).toMatchObject({
    diagnostics: { discoveredCount: 1, queuedCount: 1, requestCount: 1, enabled: true },
  });
  await expect.poll(() => observedJevRequestCount, { timeout: 10_000 }).toBe(1);
  expect(jevRequestCount).toBe(1);
  await expect(recommendation).toHaveCSS('display', 'block');
  const chip = recommendation.locator('.l-ragebait-debug-chip');
  await expect(chip).toHaveText('R 29% · C 36%');
  await expect(chip).toHaveAttribute('title', /Active hide threshold: 85%/u);
  await expect(chip).toHaveAttribute('title', /This content tries to provoke arguments about gaming\./u);
});
