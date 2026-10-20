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

function textarea(id: string): HTMLTextAreaElement {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLTextAreaElement)) {
    throw new Error(`Missing textarea ${id}.`);
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
  threshold: input('threshold'),
  animations: input('animations'),
  debugMode: input('debug-mode'),
  customRuleEnabled: input('custom-rule-enabled'),
  customRule: textarea('custom-rule'),
  apiKey: input('api-key'),
  hiddenSearch: input('hidden-search'),
};

let hiddenItems: readonly RecentHiddenItem[] = [];
let hiddenItemsTabId: number | undefined;

function reportError(error: unknown): void {
  console.error(error);
  textElement('error').textContent = 'Something went wrong. Content will remain visible.';
}

function readSettings(): Settings {
  const sensitivity = Number(controls.threshold.value) / 100;
  return {
    enabled: controls.enabled.checked,
    platforms: { x: controls.platformX.checked, youtube: controls.platformYouTube.checked },
    categories: {
      ragebait: controls.ragebait.checked,
    },
    threshold: 0.95 - sensitivity * 0.25,
    animations: controls.animations.checked,
    debugMode: controls.debugMode.checked,
    customRule: {
      enabled: controls.customRuleEnabled.checked,
      instruction: controls.customRule.value.trim(),
    },
  };
}

function displaySettings(settings: Settings): void {
  controls.enabled.checked = settings.enabled;
  controls.platformX.checked = settings.platforms.x;
  controls.platformYouTube.checked = settings.platforms.youtube;
  controls.ragebait.checked = settings.categories.ragebait;
  controls.threshold.value = String(Math.round(((0.95 - settings.threshold) / 0.25) * 100));
  controls.animations.checked = settings.animations;
  controls.debugMode.checked = settings.debugMode;
  controls.customRuleEnabled.checked = settings.customRule.enabled;
  controls.customRule.value = settings.customRule.instruction;
  updateCustomRuleVisibility();
  textElement('threshold-output').textContent = `${controls.threshold.value}%`;
}

function updateCustomRuleVisibility(): void {
  textElement('custom-rule-fields').hidden = !controls.customRuleEnabled.checked;
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

function renderHiddenItems(): void {
  const list = textElement('hidden-items');
  list.replaceChildren();
  const query = controls.hiddenSearch.value.trim().toLocaleLowerCase();
  const visibleItems = hiddenItems.filter((item) => (
    `${item.excerpt} ${item.categories.join(' ')}`.toLocaleLowerCase().includes(query)
  ));
  const empty = textElement('hidden-empty');
  empty.textContent = hiddenItems.length === 0
    ? 'Nothing hidden in this tab.'
    : 'No hidden items match your search.';
  empty.hidden = visibleItems.length > 0;
  controls.hiddenSearch.disabled = hiddenItems.length === 0;
  for (const item of visibleItems) {
    const listItem = document.createElement('li');
    const description = document.createElement('p');
    description.textContent = item.excerpt;
    const restore = document.createElement('button');
    restore.type = 'button';
    restore.textContent = 'Restore';
    restore.addEventListener('click', () => {
      if (hiddenItemsTabId !== undefined) {
        void restoreItem(hiddenItemsTabId, item.id).catch(reportError);
      }
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
  hiddenItems = items;
  hiddenItemsTabId = tabId;
  renderHiddenItems();
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

for (const control of Object.values(controls).filter(
  (control) => control !== controls.apiKey && control !== controls.hiddenSearch,
)) {
  control.addEventListener('change', () => {
    if (control === controls.threshold) {
      textElement('threshold-output').textContent = `${control.value}%`;
    }
    if (control === controls.customRuleEnabled) {
      updateCustomRuleVisibility();
    }
    void saveCurrentSettings().catch(reportError);
  });
}

controls.hiddenSearch.addEventListener('input', renderHiddenItems);

textElement('save-api-key').addEventListener('click', () => {
  void saveKey().catch(reportError);
});
textElement('refresh-hidden').addEventListener('click', () => {
  void loadHiddenItems().catch(reportError);
});

void initialize().catch(reportError);
