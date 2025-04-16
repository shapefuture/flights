import { vi } from 'vitest';
import React from 'react';

// Mock React Router DOM components and hooks
const useNavigate = vi.fn();
const useLocation = vi.fn(() => ({ pathname: '/test', search: '', hash: '', state: null }));
const useParams = vi.fn(() => ({}));
const useSearchParams = vi.fn(() => [new URLSearchParams(), vi.fn()]);
const useRouteError = vi.fn(() => null);

const Navigate = ({ to }: { to: string }) => <div data-testid="navigate" data-to={to}></div>;

const Link = ({ to, children, ...rest }: { to: string; children: React.ReactNode; [key: string]: any }) => (
  <a href={to} {...rest}>{children}</a>
);

const Routes = ({ children }: { children: React.ReactNode }) => <div data-testid="routes">{children}</div>;

const Route = ({ path, element }: { path: string; element: React.ReactNode }) => (
  <div data-testid="route" data-path={path}>{element}</div>
);

const Outlet = () => <div data-testid="outlet" />;

const BrowserRouter = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="browser-router">{children}</div>
);

const MemoryRouter = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="memory-router">{children}</div>
);

export {
  BrowserRouter,
  Link,
  MemoryRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useRouteError,
  useSearchParams
};