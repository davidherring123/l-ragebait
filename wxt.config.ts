import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'L Ragebait',
    description: 'Conservatively hides ragebait and inflammatory discussions on X and YouTube.',
    version: '0.1.0',
    permissions: ['storage'],
    host_permissions: [
      'https://x.com/*',
      'https://twitter.com/*',
      'https://www.youtube.com/*',
      'https://api.typesafe.ai/*',
    ],
  },
});
