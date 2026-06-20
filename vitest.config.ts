import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

// Multi-project setup: Node-environment packages/services, plus the web app under
// jsdom (its config lives in apps/web/vitest.config.ts and reuses the Vite config).
export default defineConfig({
  test: {
    projects: [
      {
        // The shared package is resolved to its TypeScript source so tests run
        // without a prior build step; production builds still consume `dist`.
        resolve: {
          alias: {
            '@curator/shared': resolve(__dirname, 'packages/shared/src/index.ts'),
          },
        },
        test: {
          name: 'node',
          globals: true,
          environment: 'node',
          include: ['packages/*/src/**/*.test.ts', 'apps/gateway/src/**/*.test.ts'],
        },
      },
      './apps/web/vitest.config.ts',
    ],
  },
});
