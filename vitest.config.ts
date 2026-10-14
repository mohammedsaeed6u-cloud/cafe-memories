import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    env: {
      NEXT_PUBLIC_WALLETWALLET_API_KEY: process.env.NEXT_PUBLIC_WALLETWALLET_API_KEY || 'ww_live_mock_env_key',
      WALLETWALLET_API_KEY: process.env.WALLETWALLET_API_KEY || 'ww_live_mock_env_key',
    },
  },
  resolve: {
    alias: {
      '@/middleware': path.resolve(__dirname, './src/proxy.ts'),
      '@': path.resolve(__dirname, './src'),
    },
  },
});
