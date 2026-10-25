import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'load-tests'],
    testTimeout: 15_000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // `server-only` is a marker package that throws when bundled for the
      // browser. Vitest runs server routes in a jsdom worker, so it is aliased
      // to an empty module; the real guard still applies in `next build`.
      'server-only': path.resolve(__dirname, './tests/stubs/server-only.ts'),
      'client-only': path.resolve(__dirname, './tests/stubs/client-only.ts'),
    },
  },
});
