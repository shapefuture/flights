import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    multiple: 'globals', // Fix: Properly expose describe and vi functions
    setupFiles: ['./src/setupTests.ts'],
    include: ['src/**/__tests__/*.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    mockReset: true,
    restoreMocks: true,
    testTimeout: 10000, // Increase timeout for async tests
  }
});