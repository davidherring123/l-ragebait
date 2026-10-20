import type { ContentCandidate } from '../../domain/platform';
import type { PlatformAdapter } from '../../application/ports';
import {
  matchingElements,
  normalizedText,
} from '../platform-adapter';

const ITEM_SELECTOR = [
  'ytd-rich-item-renderer',
  'ytd-video-renderer',
  'ytd-compact-video-renderer',
  'ytd-reel-item-renderer',
  'yt-lockup-view-model',
].join(',');

const TITLE_SELECTOR = '#video-title, #video-title-link, .yt-lockup-metadata-view-model__title';
const CHANNEL_SELECTOR = '#channel-name, ytd-channel-name, .yt-lockup-metadata-view-model__metadata';

function extractYouTubeItem(element: HTMLElement): ContentCandidate | undefined {
  const title = element.querySelector<HTMLElement>(TITLE_SELECTOR)?.textContent;
  const channel = element.querySelector<HTMLElement>(CHANNEL_SELECTOR)?.textContent;
  const metadata = element.querySelector<HTMLElement>('#metadata-line')?.textContent;
  const text = normalizedText([title, channel, metadata]);
  if (text.length < 12) {
    return undefined;
  }
  return { element, platform: 'youtube', text };
}

export const youtubeAdapter: PlatformAdapter = {
  platform: 'youtube',
  discover: (root) => matchingElements(root, ITEM_SELECTOR),
  extract: extractYouTubeItem,
};
