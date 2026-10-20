import type { Settings } from '../../src/domain/settings';
import {
  ExtensionStateSchema,
  RecentHiddenItemsSchema,
  SuccessResponseSchema,
  type RecentHiddenItem,
} from '../../src/messaging/schemas';

function input(id: string): HTMLInputElement {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLInputElement)) {
    throw new Error(`Missing input ${id}.`);
  }
  return element;
}

function textElement(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (element === null) {
    throw new Error(`Missing element ${id}.`);
  }
  return element;
}

const controls = {
  enabled: input('enabled'),
  platformX: input('platform-x'),
  platformYouTube: input('platform-youtube'),
  ragebait: input('category-ragebait'),
  inflammatory: input('category-inflammatory'),
  sensationalized: input('category-sensationalized'),
  threshold: input('threshold'),
  animations: input('animations'),
  apiKey: input('api-key'),
};

function reportError(error: unknown): void {
  console.error(error);
  textElement('error').textContent = 'Something went wrong. Content will remain visible.';
}

function readSettings(): Settings {
  return {
    enabled: controls.enabled.checked,
    platforms: { x: controls.platformX.checked, youtube: controls.platformYouTube.checked },
    categories: {
      ragebait: controls.ragebait.checked,
      inflammatory: controls.inflammatory.checked,
      sensationalized: controls.sensationalized.checked,
    },
    threshold: Number(controls.threshold.value) / 100,
    animations: controls.animations.checked,
  };
}

function displaySettings(settings: Settings): void {
  controls.enabled.checked = settings.enabled;
  controls.platformX.checked = settings.platforms.x;
  controls.platformYouTube.checked = settings.platforms.youtube;
  controls.ragebait.checked = settings.categories.ragebait;
  controls.inflammatory.checked = settings.categories.inflammatory;
  controls.sensationalized.checked = settings.categories.sensationalized;
  controls.threshold.value = String(Math.round(settings.threshold * 100));
  controls.animations.checked = settings.animations;
  textElement('threshold-output').textContent = `${controls.threshold.value}%`;
}

async function saveCurrentSettings(): Promise<void> {
  const response: unknown = await browser.runtime.sendMessage({
    type: 'saveSettings',
    settings: readSettings(),
  });
  SuccessResponseSchema.parse(response);
}

async function activeTabId(): Promise<number | undefined> {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  return tabs.at(0)?.id;
}

function renderHiddenItems(items: readonly RecentHiddenItem[], tabId: number): void {
  const list = textElement('hidden-items');
  list.replaceChildren();
  textElement('hidden-empty').hidden = items.length > 0;
  for (const item of items) {
    const listItem = document.createElement('li');
    const description = document.createElement('p');
    description.textContent = item.excerpt;
    const restore = document.createElement('button');
    restore.type = 'button';
    restore.textContent = 'Restore';
    restore.addEventListener('click', () => {
      void restoreItem(tabId, item.id).catch(reportError);
    });
    listItem.append(description, restore);
    list.append(listItem);
  }
}

async function loadHiddenItems(): Promise<void> {
  const tabId = await activeTabId();
  if (tabId === undefined) {
    return;
  }
  const response: unknown = await browser.tabs
    .sendMessage(tabId, { type: 'getHiddenItems' })
    .catch(() => []);
  const items = RecentHiddenItemsSchema.parse(response);
  renderHiddenItems(items, tabId);
}

async function restoreItem(tabId: number, id: string): Promise<void> {
  const response: unknown = await browser.tabs.sendMessage(tabId, { type: 'restoreHiddenItem', id });
  SuccessResponseSchema.parse(response);
  await loadHiddenItems();
}

async function saveKey(): Promise<void> {
  const response: unknown = await browser.runtime.sendMessage({
    type: 'saveApiKey',
    apiKey: controls.apiKey.value,
  });
  SuccessResponseSchema.parse(response);
  controls.apiKey.value = '';
  await initialize();
}

async function initialize(): Promise<void> {
  textElement('error').textContent = '';
  const response: unknown = await browser.runtime.sendMessage({ type: 'getExtensionState' });
  const state = ExtensionStateSchema.parse(response);
  displaySettings(state.settings);
  textElement('session-count').textContent = String(state.statistics.session);
  textElement('lifetime-count').textContent = String(state.statistics.lifetime);
  textElement('api-status').textContent = state.hasApiKey ? 'API key saved' : 'No API key saved';
  await loadHiddenItems();
}

for (const control of Object.values(controls).filter((control) => control !== controls.apiKey)) {
  control.addEventListener('change', () => {
    if (control === controls.threshold) {
      textElement('threshold-output').textContent = `${control.value}%`;
    }
    void saveCurrentSettings().catch(reportError);
  });
}

textElement('save-api-key').addEventListener('click', () => {
  void saveKey().catch(reportError);
});
textElement('refresh-hidden').addEventListener('click', () => {
  void loadHiddenItems().catch(reportError);
});

void initialize().catch(reportError);
