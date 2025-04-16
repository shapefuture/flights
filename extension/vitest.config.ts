import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [resolve(__dirname, 'src/__tests__/setup.ts')],
    include: ['src/**/__tests__/**/*.{ts,tsx}'], // Explicitly include all tests in __tests__ directories
    exclude: ['**/node_modules/**', '**/dist/**']
  }
});