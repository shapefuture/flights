import { vi, describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';

// Expose Vitest globals
global.describe = describe;
global.it = it;
global.expect = expect;
global.beforeEach = beforeEach;
global.afterEach = afterEach;
global.beforeAll = beforeAll;
global.afterAll = afterAll;
global.vi = vi;

// Mock chrome API with mock functions properly configured
const mockAddListener = vi.fn();
const mockSendMessage = vi.fn();
const mockGet = vi.fn().mockImplementation((keys, callback) => {
  if (callback) callback({});
  return Promise.resolve({});
});
const mockSet = vi.fn().mockImplementation((data, callback) => {
  if (callback) callback();
  return Promise.resolve();
});

// Setup chrome API mock with proper structure
global.chrome = {
  runtime: {
    onInstalled: {
      addListener: mockAddListener
    },
    onMessageExternal: {
      addListener: mockAddListener
    },
    getManifest: vi.fn(() => ({ version: '0.1.0' })),
    lastError: null
  },
  storage: {
    local: {
      get: mockGet,
      set: mockSet,
      getBytesInUse: vi.fn().mockImplementation((keys, callback) => {
        if (callback) callback(0);
        return Promise.resolve(0);
      })
    }
  },
  tabs: {
    sendMessage: mockSendMessage
  }
};

// Don't try to set the mock.calls property directly - it's already handled by vi.fn()

// Mock fetch API
global.fetch = vi.fn(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    status: 200,
    headers: new Headers()
  }) as any
);

// Mock localStorage
global.localStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};