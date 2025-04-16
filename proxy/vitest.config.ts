import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    multiple: 'globals', // Fix: Properly expose describe and vi functions
    setupFiles: ['./src/__tests__/setup.ts']
  }
});