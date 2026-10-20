import { startContentScript } from '../src/content/start-content-script';
import { xAdapter } from '../src/platforms/x/x-adapter';

export default defineContentScript({
  matches: ['https://x.com/*', 'https://twitter.com/*'],
  runAt: 'document_idle',
  async main(): Promise<void> {
    await startContentScript(xAdapter);
  },
});
