import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

// Reuse the app's Vite config (React plugin + `@` / `@curator/shared` aliases) and
// layer on the jsdom test environment for component tests.
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      name: 'web',
      globals: true,
      environment: 'jsdom',
      include: ['src/**/*.test.{ts,tsx}'],
      setupFiles: ['./vitest.setup.ts'],
    },
  }),
);
