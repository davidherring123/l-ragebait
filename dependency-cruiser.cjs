/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'no-unresolved',
      severity: 'error',
      from: {},
      to: { couldNotResolve: true },
    },
    {
      name: 'domain-is-independent',
      severity: 'error',
      from: { path: '^src/domain' },
      to: { path: '^(entrypoints|src/(application|classifier|messaging|platforms|popup|removal|storage))' },
    },
    {
      name: 'application-does-not-use-implementations',
      severity: 'error',
      from: { path: '^src/application' },
      to: { path: '^(entrypoints|src/(classifier|platforms|popup|removal|storage))' },
    },
    {
      name: 'platforms-do-not-use-provider-or-storage',
      severity: 'error',
      from: { path: '^src/platforms' },
      to: { path: '^src/(classifier|storage|popup)' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    includeOnly: '^(src|entrypoints)',
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: { exportsFields: ['exports'] },
    reporterOptions: { dot: { collapsePattern: 'node_modules/[^/]+' } },
  },
};
