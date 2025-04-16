import '@testing-library/jest-dom';
import { vi } from 'vitest';

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
vi.mock('@radix-ui/react-slot', () => ({
  Slot: ({ children }: { children: React.ReactNode }) => children,
  default: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('@radix-ui/react-slider', () => ({
  Root: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Track: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Range: () => <div />,
  Thumb: () => <div />,
}));

vi.mock('@radix-ui/react-switch', () => ({
  Root: ({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (checked: boolean) => void }) => (
    <button 
      role="switch" 
      aria-checked={checked} 
      onClick={() => onCheckedChange(!checked)}
    />
  ),
}));

// Mock React Router DOM
vi.mock('react-router-dom');

// Mock ResizeObserver which isn't available in JSDOM
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Add any other test setup here