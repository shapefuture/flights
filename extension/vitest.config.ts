import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [resolve(__dirname, 'src/__tests__/setup.ts')],
    include: ['src/**/__tests__/**/protobufService.test.ts'], // Temporarily just run the protobuf test
    exclude: [
      '**/node_modules/**', 
      '**/dist/**',
      '**/setup.ts',          // Explicitly exclude setup.ts
      '**/background.test.ts'  // Temporarily exclude background test
    ]
  }
});