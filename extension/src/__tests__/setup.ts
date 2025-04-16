import { vi } from 'vitest';

// Expose Vitest globals to make tests more readable
global.describe = vi.describe;
global.it = vi.it;
global.expect = vi.expect;
global.beforeEach = vi.beforeEach;
global.afterEach = vi.afterEach;
global.beforeAll = vi.beforeAll;
global.afterAll = vi.afterAll;
global.jest = vi;

// Mock chrome API
global.chrome = {
  runtime: {
    onInstalled: {
      addListener: vi.fn()
    },
    onMessageExternal: {
      addListener: vi.fn()
    },
    getManifest: vi.fn(() => ({ version: '0.1.0' })),
    lastError: null
  },
  storage: {
    local: {
      get: vi.fn().mockImplementation((keys, callback) => {
        if (callback) callback({});
        return Promise.resolve({});
      }),
      set: vi.fn().mockImplementation((data, callback) => {
        if (callback) callback();
        return Promise.resolve();
      }),
      getBytesInUse: vi.fn().mockImplementation((keys, callback) => {
        if (callback) callback(0);
        return Promise.resolve(0);
      })
    }
  },
  tabs: {
    sendMessage: vi.fn()
  }
};

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