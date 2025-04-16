# Flight Finder Testing Documentation

This document outlines the testing strategy for the Flight Finder application, including what types of tests are implemented, how to run them, and how to write new tests.

## Testing Strategy

The Flight Finder app uses a comprehensive testing approach that includes:

1. **Unit Tests** - Testing individual functions and components in isolation
2. **Component Tests** - Testing React components with rendered output
3. **Integration Tests** - Testing interactions between multiple components
4. **End-to-End Tests** - Testing the full application as a user would experience it

## Test Technologies

- **Vitest** - Core test runner for unit, component, and integration tests
- **React Testing Library** - For testing React components
- **Cypress** - For end-to-end testing
- **Jest DOM** - For DOM assertion helpers
- **Mock Service Worker** - For API mocking

## Running Tests

### Unit, Component, and Integration Tests

```bash
# Run all tests in watch mode
pnpm test:watch

# Run all tests and generate coverage report
pnpm test:coverage

# Run tests with UI
pnpm test:ui
```

### End-to-End Tests

```bash
# Run Cypress tests in headless mode
pnpm test:e2e

# Open Cypress UI for debugging
pnpm test:e2e:open
```

### Running All Tests

```bash
# Run all tests (unit, integration, and e2e)
pnpm test:all
```

## Writing New Tests

### Unit Test Example

```typescript
// File: utils/__tests__/example.test.ts
import { describe, it, expect } from 'vitest';
import { myFunction } from '../example';

describe('myFunction', () => {
  it('should return the expected result', () => {
    const result = myFunction(1, 2);
    expect(result).toBe(3);
  });
});
```

### Component Test Example

```tsx
// File: components/__tests__/example.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const handleClick = vi.fn();
    render(<MyComponent onClick={handleClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

### E2E Test Example

```typescript
// File: cypress/e2e/example.cy.ts
describe('Example Test', () => {
  it('should navigate to the home page', () => {
    cy.visit('/');
    cy.contains('Flight Finder Agent').should('be.visible');
  });

  it('should submit a search query', () => {
    cy.visit('/');
    cy.get('input[placeholder*="Find me a flight"]').type('Flight from NYC to London');
    cy.get('button').contains('Search Flights').click();
    cy.contains('Agent Status').should('be.visible');
  });
});
```

## Mocking

### Mocking API Requests

The application uses the `fetch` API for network requests. In tests, we mock this using Vitest's mocking capabilities:

```typescript
import { vi } from 'vitest';

// Mock fetch globally
vi.mock('global.fetch', () => {
  return {
    default: vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: 'test data' }),
      })
    ),
  };
});
```

### Mocking Chrome Extension API

For extension-related functionality, we mock the Chrome API:

```typescript
// Mock Chrome API
global.chrome = {
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn()
    },
    lastError: null
  }
} as any;
```

## Test Coverage

We aim for a minimum of 75% test coverage across the codebase. Coverage reports are generated using Vitest's coverage tools and can be viewed after running:

```bash
pnpm test:coverage
```

## Continuous Integration

Tests are run automatically on GitHub Actions for every pull request and push to the main branch. The workflow configuration can be found in `.github/workflows/test.yml`.