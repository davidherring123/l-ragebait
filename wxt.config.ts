import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'L Ragebait',
    description: 'Conservatively hides ragebait and inflammatory discussions on X and YouTube.',
    version: '0.1.0',
    icons: {
      16: 'icon/icon16.png',
      32: 'icon/icon32.png',
      48: 'icon/icon48.png',
      128: 'icon/icon128.png',
    },
    action: {
      default_icon: {
        16: 'icon/icon16.png',
        32: 'icon/icon32.png',
        48: 'icon/icon48.png',
        128: 'icon/icon128.png',
      },
    },
    permissions: ['storage'],
    host_permissions: [
      'https://x.com/*',
      'https://twitter.com/*',
      'https://www.youtube.com/*',
      'https://api.typesafe.ai/*',
    ],
  },
});
