import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: [resolve(__dirname, 'src/__tests__/setup.ts')],
    include: ['src/**/__tests__/**/*.test.{ts,tsx}'], // Only include *.test.ts files
    exclude: [
      '**/node_modules/**', 
      '**/dist/**',
      '**/setup.ts'          // Explicitly exclude setup.ts
    ],
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
  }
});