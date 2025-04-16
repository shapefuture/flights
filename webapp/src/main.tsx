import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import { PricingPage } from './pages/pricing-page';
import AuthCallbackPage from './pages/auth-callback';
import { Toaster } from './components/ui/toaster';
import './index.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/pricing',
    element: <PricingPage />,
  },
  {
    path: '/auth/callback',
    element: <AuthCallbackPage />,
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
    <Toaster />
  </React.StrictMode>,
);