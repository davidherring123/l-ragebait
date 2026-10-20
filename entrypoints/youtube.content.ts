import { startContentScript } from '../src/content/start-content-script';
import { youtubeAdapter } from '../src/platforms/youtube/youtube-adapter';

export default defineContentScript({
  matches: ['https://www.youtube.com/*'],
  runAt: 'document_idle',
  async main(): Promise<void> {
    await startContentScript(youtubeAdapter);
  },
});
