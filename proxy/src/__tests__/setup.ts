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

// Mock fetch API
global.fetch = vi.fn().mockImplementation(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    status: 200,
    headers: new Headers({})
  })
);

// Mock Response constructor
global.Response = class {
  status: number;
  headers: Headers;
  body: any;

  constructor(body?: any, init?: ResponseInit) {
    this.status = init?.status || 200;
    this.headers = new Headers(init?.headers);
    this.body = body;
  }

  json() {
    return Promise.resolve(
      typeof this.body === 'string' ? JSON.parse(this.body) : this.body
    );
  }

  text() {
    return Promise.resolve(
      typeof this.body === 'string' ? this.body : JSON.stringify(this.body)
    );
  }
} as any;

// Mock Request constructor
global.Request = class {
  url: string;
  method: string;
  headers: Headers;
  body: any;

  constructor(input: string | Request, init?: RequestInit) {
    this.url = typeof input === 'string' ? input : input.url;
    this.method = init?.method || 'GET';
    this.headers = new Headers(init?.headers);
    this.body = init?.body;
  }

  json() {
    return Promise.resolve(
      typeof this.body === 'string' ? JSON.parse(this.body) : this.body
    );
  }
} as any;

// Mock Headers constructor
global.Headers = class {
  private headers: Record<string, string> = {};

  constructor(init?: HeadersInit) {
    if (init) {
      if (init instanceof Headers) {
        // Copy headers
      } else if (Array.isArray(init)) {
        init.forEach(([key, value]) => {
          this.set(key, value);
        });
      } else {
        Object.entries(init).forEach(([key, value]) => {
          this.set(key, value);
        });
      }
    }
  }

  get(name: string): string | null {
    return this.headers[name.toLowerCase()] || null;
  }

  set(name: string, value: string): void {
    this.headers[name.toLowerCase()] = value;
  }
} as any;