import { ClassificationService } from '../src/application/classification-service';
import { decideClassification } from '../src/domain/classification';
import type { Settings } from '../src/domain/settings';
import { JevClient, CLASSIFIER_POLICY_VERSION } from '../src/classifier/jev-client';
import { BackgroundRequestSchema, type BackgroundRequest } from '../src/messaging/schemas';
import { cacheScores, getCachedScores } from '../src/storage/decision-cache';
import {
  clearApiKey,
  getApiKey,
  getSettings,
  saveApiKey,
  saveSettings,
} from '../src/storage/settings-store';
import {
  getStatistics,
  incrementStatistics,
  initializeStatistics,
} from '../src/storage/statistics-store';

const jevClient = new JevClient();
const classificationService = new ClassificationService(
  jevClient,
  { get: getCachedScores, set: cacheScores },
  CLASSIFIER_POLICY_VERSION,
);

async function broadcastSettings(settings: Settings): Promise<void> {
  const tabs = await browser.tabs.query({
    url: ['https://x.com/*', 'https://twitter.com/*', 'https://www.youtube.com/*'],
  });
  await Promise.all(
    tabs.map(async (tab) => {
      if (tab.id !== undefined) {
        await browser.tabs.sendMessage(tab.id, { type: 'settingsChanged', settings }).catch(() => undefined);
      }
    }),
  );
}

async function classify(request: Extract<BackgroundRequest, { type: 'classify' }>): Promise<unknown> {
  const settings = await getSettings();
  if (!settings.enabled || !settings.platforms[request.platform]) {
    return { ok: false };
  }
  const apiKey = await getApiKey();
  if (apiKey === undefined) {
    return { ok: false };
  }

  try {
    const scores = await classificationService.classify(request.hash, request.text, apiKey);
    const decision = decideClassification(scores, settings.categories, settings.threshold);
    return { ok: true, scores, ...decision };
  } catch (error: unknown) {
    console.warn('L Ragebait kept content visible because classification failed.', error);
    return { ok: false };
  }
}

async function handleRequest(request: BackgroundRequest): Promise<unknown> {
  switch (request.type) {
    case 'classify':
      return classify(request);
    case 'getContentSettings':
      return getSettings();
    case 'getExtensionState': {
      const [settings, statistics, apiKey] = await Promise.all([
        getSettings(),
        getStatistics(),
        getApiKey(),
      ]);
      return { settings, statistics, hasApiKey: apiKey !== undefined };
    }
    case 'saveSettings':
      await saveSettings(request.settings);
      await broadcastSettings(request.settings);
      return { ok: true };
    case 'saveApiKey':
      if (request.apiKey.trim().length === 0) {
        await clearApiKey();
      } else {
        await saveApiKey(request.apiKey);
      }
      await broadcastSettings(await getSettings());
      return { ok: true };
    case 'recordHidden':
      return { ok: true, statistics: await incrementStatistics() };
  }
}

export default defineBackground(() => {
  void browser.storage.local
    .setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' })
    .catch((error: unknown) => {
      console.error('L Ragebait could not restrict local storage access.', error);
    });
  void initializeStatistics().catch((error: unknown) => {
    console.error('L Ragebait could not initialize statistics.', error);
  });

  browser.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
    const parsed = BackgroundRequestSchema.safeParse(message);
    if (!parsed.success) {
      return undefined;
    }
    void handleRequest(parsed.data).then(sendResponse, (error: unknown) => {
      console.error('L Ragebait message handling failed.', error);
      sendResponse({ ok: false });
    });
    return true;
  });
});
