import { FilteringController } from '../application/filtering-controller';
import type { PlatformAdapter } from '../application/ports';
import { hashContent } from '../classifier/content-hash';
import { defaultSettings, SettingsSchema } from '../domain/settings';
import { ContentRequestSchema } from '../messaging/schemas';
import { AnimationController } from '../removal/animation-controller';
import { HiddenItemRegistry } from '../removal/hidden-item-registry';

export async function startContentScript(adapter: PlatformAdapter): Promise<void> {
  const response: unknown = await browser.runtime
    .sendMessage({ type: 'getContentSettings' })
    .catch(() => undefined);
  const parsedSettings = SettingsSchema.safeParse(response);
  const settings = parsedSettings.success ? parsedSettings.data : defaultSettings;
  const registry = new HiddenItemRegistry();
  const animation = new AnimationController(registry);
  const controller = new FilteringController(adapter, animation, hashContent, settings);

  browser.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
    const parsed = ContentRequestSchema.safeParse(message);
    if (!parsed.success) {
      return undefined;
    }
    switch (parsed.data.type) {
      case 'settingsChanged':
        controller.updateSettings(parsed.data.settings);
        sendResponse({ ok: true });
        return false;
      case 'getHiddenItems':
        sendResponse(registry.list());
        return false;
      case 'getDiagnostics':
        sendResponse(controller.getDiagnostics());
        return false;
      case 'restoreHiddenItem':
        sendResponse({ ok: registry.restore(parsed.data.id) });
        return false;
    }
  });

  controller.start();
}
