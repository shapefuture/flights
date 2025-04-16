// setupTests.ts - Configuration for Vitest and Jest test environments

// Import necessary test libraries
import '@testing-library/jest-dom';
import { vi, expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Set up global mocks
const globalMock = globalThis as any;

// Setup vitest globals as Jest globals for compatibility
globalMock.jest = vi;
globalMock.jest.spyOn = vi.spyOn;
globalMock.jest.fn = vi.fn;
globalMock.jest.mock = vi.mock;

// Setup afterAll if it doesn't exist (for Jest compatibility)
if (!globalMock.afterAll) {
  globalMock.afterAll = vi.afterAll || ((fn) => fn());
}

// Mock fetch API
globalMock.fetch = vi.fn();

// Automatically clean up after each test
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signUp: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(() => ({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({ data: null, error: null })),
          maybeSingle: vi.fn(() => ({ data: null, error: null })),
        })),
      })),
      insert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn() })) })),
      update: vi.fn(() => ({ eq: vi.fn() })),
      delete: vi.fn(() => ({ eq: vi.fn() })),
    })),
    rpc: vi.fn(() => ({ data: null, error: null })),
  })),
}));

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(() => vi.fn()),
  useLocation: vi.fn(() => ({ pathname: '/', search: '', hash: '', state: null })),
  useParams: vi.fn(() => ({})),
  Link: ({ children, to, ...props }) => React.createElement('a', { href: to, ...props }, children),
  Outlet: ({ children }) => React.createElement('div', { 'data-testid': 'outlet' }, children),
  Navigate: ({ to }) => React.createElement('div', { 'data-testid': 'navigate', to }, null),
  BrowserRouter: ({ children }) => React.createElement('div', { 'data-testid': 'browser-router' }, children),
  Routes: ({ children }) => React.createElement('div', { 'data-testid': 'routes' }, children),
  Route: () => null,
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: localStorageMock,
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock window.URL.createObjectURL
Object.defineProperty(URL, 'createObjectURL', {
  value: vi.fn(),
});

// Mock ResizeObserver
globalMock.ResizeObserver = class ResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
};

export {};