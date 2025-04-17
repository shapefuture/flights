// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock supabase
vi.mock('./lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signInWithOAuth: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn()
    }
  },
  incrementQueriesUsed: vi.fn(),
  getUserSubscription: vi.fn(),
  AuthProvider: {
    GOOGLE: 'google',
    EMAIL: 'email'
  }
}));

// Mock stripe
vi.mock('./lib/stripe', () => ({
  default: Promise.resolve({}),
  getStripe: vi.fn().mockResolvedValue({}),
  subscriptionPlans: [
    {
      id: 'basic',
      name: 'Basic',
      description: 'Basic plan',
      features: ['Feature 1'],
      priceMonthly: 9.99,
      priceYearly: 99.99,
      monthlyQuota: 20,
      stripePriceId: {
        monthly: 'price_123',
        yearly: 'price_456'
      }
    }
  ],
  createCheckoutSession: vi.fn().mockResolvedValue('https://test.stripe.com'),
  createCustomerPortalSession: vi.fn().mockResolvedValue('https://test.stripe.com')
}));

// Setup test environment
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

// Mock window.SpeechRecognition
global.SpeechRecognition = vi.fn().mockImplementation(() => ({
  start: vi.fn(),
  stop: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
}));

// Mock window.localStorage
const localStorageMock = (function() {
  let store: Record<string, string> = {};
  return {
    getItem: function(key: string) {
      return store[key] || null;
    },
    setItem: function(key: string, value: string) {
      store[key] = value.toString();
    },
    removeItem: function(key: string) {
      delete store[key];
    },
    clear: function() {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Set up Intersection Observer mock
class MockIntersectionObserver {
  constructor(callback: IntersectionObserverCallback) {}
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

window.IntersectionObserver = MockIntersectionObserver as any;