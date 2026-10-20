import { describe, expect, it } from 'vitest';

import { xAdapter } from '../../src/platforms/x/x-adapter';
import { youtubeAdapter } from '../../src/platforms/youtube/youtube-adapter';

describe('platform adapters', () => {
  it('extracts an X post and quote text', () => {
    document.body.innerHTML = `
      <article data-testid="tweet">
        <div data-testid="User-Name">Reporter @reporter</div>
        <div data-testid="tweetText">A factual update about the city council.</div>
        <div data-testid="tweetText">Quoted context from the public record.</div>
      </article>`;
    const elements = xAdapter.discover(document);
    const first = elements.at(0);

    expect(first).toBeDefined();
    expect(first === undefined ? undefined : xAdapter.extract(first)?.text).toContain('Quoted context');
  });

  it('extracts a YouTube recommendation', () => {
    document.body.innerHTML = `
      <ytd-rich-item-renderer>
        <a id="video-title">Calm analysis of this week's policy changes</a>
        <div id="channel-name">Useful Channel</div>
        <div id="metadata-line">12K views · 2 hours ago</div>
      </ytd-rich-item-renderer>`;
    const elements = youtubeAdapter.discover(document);
    const first = elements.at(0);

    expect(first).toBeDefined();
    expect(first === undefined ? undefined : youtubeAdapter.extract(first)?.text).toContain('Useful Channel');
  });

  it('ignores items without sufficient text', () => {
    const element = document.createElement('ytd-reel-item-renderer');
    element.innerHTML = '<a id="video-title">Hi</a>';
    expect(youtubeAdapter.extract(element)).toBeUndefined();
  });

  it('extracts titles from newer YouTube view-model markup', () => {
    document.body.innerHTML = `
      <yt-lockup-view-model>
        <div id="meta">
          <div role="link">Kyedae's Return Is Already Causing Drama</div>
          <span>Example Channel</span>
        </div>
      </yt-lockup-view-model>`;
    const element = document.querySelector<HTMLElement>('yt-lockup-view-model');

    expect(element).not.toBeNull();
    expect(element === null ? undefined : youtubeAdapter.extract(element)?.text).toContain(
      "Kyedae's Return Is Already Causing Drama",
    );
    expect(element === null ? undefined : youtubeAdapter.getDebugAnchor(element)?.getAttribute('role')).toBe('link');
  });
});
