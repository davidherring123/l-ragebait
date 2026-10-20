import type { ContentCandidate } from '../../domain/platform';
import type { PlatformAdapter } from '../../application/ports';
import {
  matchingElements,
  normalizedText,
} from '../platform-adapter';

const ITEM_SELECTOR = [
  'ytd-rich-item-renderer',
  'ytd-rich-grid-media',
  'ytd-video-renderer',
  'ytd-grid-video-renderer',
  'ytd-compact-video-renderer',
  'ytd-playlist-video-renderer',
  'ytd-reel-item-renderer',
  'yt-lockup-view-model',
].join(',');

const TITLE_SELECTOR = [
  '#video-title',
  '#video-title-link',
  '.yt-lockup-metadata-view-model__title',
  'a[href*="/watch"]',
  'a[href*="/shorts/"]',
].join(',');
const CHANNEL_SELECTOR = '#channel-name, ytd-channel-name, .yt-lockup-metadata-view-model__metadata';

function elementLabel(element: HTMLElement): string | null {
  const text = element.textContent.trim();
  if (text.length > 0) {
    return text;
  }
  return element.getAttribute('title') ?? element.getAttribute('aria-label');
}

function findTitle(element: HTMLElement): HTMLElement | undefined {
  return [...element.querySelectorAll<HTMLElement>(TITLE_SELECTOR)].find(
    (candidate) => (elementLabel(candidate)?.length ?? 0) > 2,
  );
}

function discoverYouTubeItems(root: ParentNode): HTMLElement[] {
  const outerItems = matchingElements(root, ITEM_SELECTOR).map((element) => {
    const ancestor = element.parentElement?.closest<HTMLElement>(ITEM_SELECTOR);
    return ancestor ?? element;
  });
  return [...new Set(outerItems)];
}

function extractYouTubeItem(element: HTMLElement): ContentCandidate | undefined {
  const title = findTitle(element);
  const channel = element.querySelector<HTMLElement>(CHANNEL_SELECTOR)?.textContent;
  const metadata = element.querySelector<HTMLElement>('#metadata-line')?.textContent;
  const text = normalizedText([title === undefined ? undefined : elementLabel(title), channel, metadata]);
  if (text.length < 12) {
    return undefined;
  }
  return { element, platform: 'youtube', text };
}

export const youtubeAdapter: PlatformAdapter = {
  platform: 'youtube',
  discover: discoverYouTubeItems,
  extract: extractYouTubeItem,
  getDebugAnchor: (element) => {
    const title = findTitle(element);
    return title?.closest<HTMLElement>('h3')
      ?? title?.parentElement
      ?? element.querySelector<HTMLElement>('#meta, #metadata, .yt-lockup-metadata-view-model')
      ?? title;
  },
};
