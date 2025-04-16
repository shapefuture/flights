// setupTests.ts - Setup for testing environment

import { expect, afterEach, vi } from 'vitest';
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import React from 'react';

// Setup global mocks
global.React = React;

// Create mock for fetch
global.fetch = vi.fn();

// Create mock for localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}; 
global.localStorage = localStorageMock as any;

// Create mock for sessionStorage
global.sessionStorage = { ...localStorageMock } as any;

// Create mock for SpeechRecognition
global.SpeechRecognition = vi.fn(() => ({
  start: vi.fn(),
  stop: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
}));
global.webkitSpeechRecognition = global.SpeechRecognition;

// Setup afterAll for Vitest
if (!global.afterAll) {
  global.afterAll = (fn) => {
    fn();
  }
}

// Cleanup after each test
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

export {};