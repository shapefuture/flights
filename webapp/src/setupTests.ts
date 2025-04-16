import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';

// Ensure globals are defined
global.describe = vi.describe;
global.it = vi.it;
global.expect = vi.expect;
global.beforeEach = vi.beforeEach;
global.afterEach = vi.afterEach;
global.beforeAll = vi.beforeAll;
global.afterAll = vi.afterAll;
global.jest = vi;

// Mock any browser APIs that might not be available in the test environment
global.fetch = vi.fn().mockImplementation(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    status: 200,
    statusText: 'OK',
    headers: new Headers()
  })
);

// Mock logger to prevent console spam during tests
vi.mock('./utils/logger');

// Mock Supabase
vi.mock('@supabase/supabase-js', () => {
  return {
    createClient: () => ({
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        signInWithOAuth: vi.fn(),
        signOut: vi.fn(),
        onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: null }),
            order: () => ({
              limit: () => Promise.resolve({ data: [], error: null })
            })
          }),
        }),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => ({
          eq: () => Promise.resolve({ data: null, error: null }),
        }),
        delete: () => ({
          eq: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    }),
    Provider: {
      GOOGLE: 'google'
    }
  };
});

// Mock Radix UI components
vi.mock('@radix-ui/react-slot', () => {
  return {
    Slot: ({ children }) => children,
    default: ({ children }) => children,
  };
});

vi.mock('@radix-ui/react-slider', () => {
  return {
    Root: ({ children }) => React.createElement('div', null, children),
    Track: ({ children }) => React.createElement('div', null, children),
    Range: () => React.createElement('div'),
    Thumb: () => React.createElement('div'),
  };
});

vi.mock('@radix-ui/react-switch', () => {
  return {
    Root: ({ checked, onCheckedChange }) => React.createElement(
      'button', 
      { 
        role: 'switch', 
        'aria-checked': checked, 
        onClick: () => onCheckedChange(!checked)
      }
    ),
  };
});

// Mock React Router DOM
vi.mock('react-router-dom');

// Mock ResizeObserver which isn't available in JSDOM
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Add any other test setup here