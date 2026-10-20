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
const TITLE_CANDIDATE_SELECTOR = [
  TITLE_SELECTOR,
  'h3',
  '[role="link"]',
  '[class*="title"]',
  '[id*="title"]',
  'yt-formatted-string',
].join(',');
const CHANNEL_SELECTOR = '#channel-name, ytd-channel-name, .yt-lockup-metadata-view-model__metadata';

function renderedElementText(element: HTMLElement): string {
  const innerText: unknown = element.innerText;
  if (typeof innerText === 'string' && innerText.trim().length > 0) {
    return innerText.trim();
  }
  return element.textContent.trim();
}

function elementLabel(element: HTMLElement): string | null {
  const text = renderedElementText(element);
  if (text.length > 0) {
    return text;
  }
  return element.getAttribute('title') ?? element.getAttribute('aria-label');
}

function findTitle(element: HTMLElement): HTMLElement | undefined {
  let bestMatch: Readonly<{ element: HTMLElement; score: number }> | undefined;
  for (const candidate of element.querySelectorAll<HTMLElement>(TITLE_CANDIDATE_SELECTOR)) {
    const label = elementLabel(candidate);
    if (label === null || label.length < 4 || label.length > 300) {
      continue;
    }
    const titleHint = candidate.matches(TITLE_SELECTOR) ? 100 : 0;
    const headingHint = candidate.matches('h3, [class*="title"], [id*="title"]') ? 50 : 0;
    const score = titleHint + headingHint + Math.min(label.length, 100);
    if (bestMatch === undefined || score > bestMatch.score) {
      bestMatch = { element: candidate, score };
    }
  }
  return bestMatch?.element;
}

function renderedCardText(element: HTMLElement): string {
  let text = renderedElementText(element);
  for (const chip of element.querySelectorAll<HTMLElement>('.l-ragebait-debug-chip')) {
    text = text.replaceAll(chip.textContent, '');
  }
  return text;
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
  const text = normalizedText([
    title === undefined ? undefined : elementLabel(title),
    channel,
    metadata,
    title === undefined ? renderedCardText(element) : undefined,
  ]);
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
      ?? title
      ?? element.querySelector<HTMLElement>('#meta, #metadata, .yt-lockup-metadata-view-model')
      ?? element;
  },
};
