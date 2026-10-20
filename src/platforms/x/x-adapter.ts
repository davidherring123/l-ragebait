import type { ContentCandidate } from '../../domain/platform';
import type { PlatformAdapter } from '../../application/ports';
import {
  matchingElements,
  normalizedText,
} from '../platform-adapter';

const POST_SELECTOR = 'article[data-testid="tweet"]';

function extractXPost(element: HTMLElement): ContentCandidate | undefined {
  const author = element.querySelector<HTMLElement>('[data-testid="User-Name"]')?.textContent;
  const socialContext = element.querySelector<HTMLElement>('[data-testid="socialContext"]')?.textContent;
  const postParts = [...element.querySelectorAll<HTMLElement>('[data-testid="tweetText"]')].map(
    (node) => node.textContent,
  );
  const text = normalizedText([author, socialContext, ...postParts]);
  if (text.length < 12) {
    return undefined;
  }
  return { element, platform: 'x', text };
}

export const xAdapter: PlatformAdapter = {
  platform: 'x',
  discover: (root) => matchingElements(root, POST_SELECTOR),
  extract: extractXPost,
  getDebugAnchor: (element) => {
    const author = element.querySelector<HTMLElement>('[data-testid="User-Name"]');
    return author?.parentElement ?? author ?? undefined;
  },
};
