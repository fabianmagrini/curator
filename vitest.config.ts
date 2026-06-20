import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

// Resolve the shared package to its TypeScript source so tests run without a
// prior build step. Production builds still consume the compiled `dist` output.
export default defineConfig({
  resolve: {
    alias: {
      '@curator/shared': resolve(__dirname, 'packages/shared/src/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['packages/*/src/**/*.test.ts', 'apps/*/src/**/*.test.ts'],
  },
});
