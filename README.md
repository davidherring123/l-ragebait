# L Ragebait

L Ragebait is a Manifest V3 Chrome extension that conservatively hides high-confidence ragebait, hostile discussions, and sensationalized tragedy commentary on X and YouTube.

It analyzes visible text only. It does not inspect media, fetch transcripts, or permanently modify platform data. Classification failures always leave content visible.

## Current MVP

- X timelines, replies, quote posts, and search results
- YouTube home, search, sidebar recommendations, and text-bearing Shorts
- Three independent TypeSafe AI Jev `noul` scores in one request
- Configurable categories and threshold, defaulting to `0.85`
- Visible-first scheduling with `MutationObserver` and `IntersectionObserver`
- Bounded concurrency, persistent score cache, and in-flight request deduplication
- Animated or instant removal with reduced-motion support
- Active-tab restoration for recently hidden items
- Session and lifetime counts
- Strict TypeScript, type-aware ESLint, dependency-cruiser, Vitest, Playwright, and GitHub Actions

## Requirements

- Node.js 22 or newer
- npm
- Google Chrome or Chromium
- A TypeSafe API key from [console.typesafe.ai/keys](https://console.typesafe.ai/keys)

The API key is entered through the popup. It is stored in `chrome.storage.local`, restricted to trusted extension contexts, and read only by the background worker. Never commit an API key to this repository.

## Install for development

```bash
npm install
npm run build
```

Then open `chrome://extensions`, enable **Developer mode**, select **Load unpacked**, and choose:

```text
.output/chrome-mv3
```

Open the extension popup, paste your TypeSafe API key, and save it. Visit X or YouTube and keep the tab open while the extension evaluates visible recommendations.

For WXT's development browser:

```bash
npm run dev
```

## Quality gates

```bash
npm run check
```

This runs strict TypeScript checking, ESLint with zero warnings, dependency architecture checks, unit tests, and a production build.

Run extension-level tests separately:

```bash
npx playwright install chromium
npm run build
npm run test:e2e
```

## Privacy and security

- Raw browsing text is sent to TypeSafe only when classification is necessary.
- Raw browsing text is not persisted by the extension.
- Cached records contain a SHA-256 content hash, category scores, and timestamps.
- Recently hidden text exists only in the content script for the current page and is discarded with that page.
- A client-side extension cannot protect a user-owned API key from someone who controls the browser profile or local machine.
- A publicly distributed version should use an authenticated backend proxy instead of user API keys.

## Maintenance note

X and YouTube change their DOM regularly. Platform selectors are isolated under `src/platforms/` so they can be updated without changing classification or storage logic.

## License

MIT
