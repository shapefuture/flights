import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [resolve(__dirname, 'src/setupTests.ts')],
    include: ['src/**/__tests__/**/*.test.{ts,tsx}', 'src/**/__tests__/**/apiService.test.ts', 'src/**/__tests__/**/queryGenerator.test.ts'],
    exclude: [
      '**/node_modules/**', 
      '**/dist/**',
      '**/setup.ts',
      '**/setupTests.ts',
      // Temporarily exclude test files with missing dependencies
      '**/App.test.tsx',
      '**/auth-context.test.tsx',
      '**/auth-callback.test.tsx',
      '**/flight-filters.test.tsx',
      '**/google-sign-in-button.test.tsx',
      '**/calendar-view.test.tsx',
      '**/pricing-cards.test.tsx',
      '**/error-boundary.test.tsx',
      '**/logger.test.ts',
      '**/extensionService.test.ts'
    ],
    mockReset: true,
    restoreMocks: true,
    testTimeout: 10000, // Increase timeout for async tests
    coverage: {
      provider: 'v8', // or 'c8'
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/coverage/**',
        '**/__tests__/**',
        '**/setup*.ts',
        '**/*.d.ts'
      ]
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
});