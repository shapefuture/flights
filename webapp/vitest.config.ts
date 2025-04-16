import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    include: ['src/**/__tests__/*.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    mockReset: true,
    restoreMocks: true,
    testTimeout: 10000, // Increase timeout for async tests
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
});