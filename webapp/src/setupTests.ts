import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock any browser APIs that might not be available in the test environment
global.fetch = vi.fn(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve('')
  }) as any
);

// Mock logger to prevent console spam during tests
vi.mock('./utils/logger');

// Add any other test setup here