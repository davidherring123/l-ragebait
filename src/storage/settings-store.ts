import { z } from 'zod';

import { defaultSettings, SettingsSchema, type Settings } from '../domain/settings';

const SETTINGS_KEY = 'settings';
const API_KEY = 'typesafeApiKey';
const apiKeySchema = z.string().trim().min(1).max(500);

export async function getSettings(): Promise<Settings> {
  const stored = await browser.storage.local.get(SETTINGS_KEY);
  const result = SettingsSchema.safeParse(stored[SETTINGS_KEY]);
  return result.success ? result.data : defaultSettings;
}

export async function saveSettings(settings: Settings): Promise<void> {
  await browser.storage.local.set({ [SETTINGS_KEY]: SettingsSchema.parse(settings) });
}

export async function getApiKey(): Promise<string | undefined> {
  const stored = await browser.storage.local.get(API_KEY);
  const result = apiKeySchema.safeParse(stored[API_KEY]);
  return result.success ? result.data : undefined;
}

export async function saveApiKey(apiKey: string): Promise<void> {
  await browser.storage.local.set({ [API_KEY]: apiKeySchema.parse(apiKey) });
}

export async function clearApiKey(): Promise<void> {
  await browser.storage.local.remove(API_KEY);
}
