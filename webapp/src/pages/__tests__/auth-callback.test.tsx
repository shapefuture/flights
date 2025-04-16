import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import AuthCallbackPage from '../auth-callback';
import { supabase } from '../../lib/supabase';
import userEvent from '@testing-library/user-event';

// Mock dependencies
jest.mock('react-router-dom', () => {
  const originalModule = jest.requireActual('react-router-dom');
  return {
    ...originalModule,
    useNavigate: jest.fn(),
  };
});

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
  },
}));

// Mock logger
jest.mock('../../utils/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
}));

// Setup mocks before each test
const mockNavigate = jest.fn();

describe('AuthCallbackPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock navigate function
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    
    // Mock getSession with successful response by default
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: {
        session: {
          user: {
            id: 'test-user-id',
            app_metadata: { provider: 'google' }
          }
        }
      },
      error: null
    });
    
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        hash: '#access_token=test-token',
        search: '',
        pathname: '/auth/callback',
        origin: 'http://localhost:3000'
      },
      writable: true
    });
    
    // Mock setTimeout
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders loading state initially', () => {
    render(
      <MemoryRouter initialEntries={['/auth/callback']}>
        <AuthCallbackPage />
      </MemoryRouter>
    );
    
    expect(screen.getByText('Finishing sign in...')).toBeInTheDocument();
    expect(screen.getByText('Please wait while we complete your authentication')).toBeInTheDocument();
  });

  it('shows success message and navigates home on successful auth', async () => {
    render(
      <MemoryRouter initialEntries={['/auth/callback']}>
        <AuthCallbackPage />
      </MemoryRouter>
    );
    
    // Should show success message
    await waitFor(() => {
      expect(screen.getByText('Successfully signed in!')).toBeInTheDocument();
    });
    
    // Should navigate home after delay
    jest.advanceTimersByTime(1000);
    
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('shows error message when no auth data is found', async () => {
    // Empty hash and search
    Object.defineProperty(window, 'location', {
      value: {
        hash: '',
        search: '',
        pathname: '/auth/callback',
        origin: 'http://localhost:3000'
      },
      writable: true
    });
    
    render(
      <MemoryRouter initialEntries={['/auth/callback']}>
        <AuthCallbackPage />
      </MemoryRouter>
    );
    
    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('Authentication failed')).toBeInTheDocument();
      expect(screen.getByText('No authentication data found in URL. Please try signing in again.')).toBeInTheDocument();
    });
    
    // Should navigate home after delay
    jest.advanceTimersByTime(5000);
    
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('shows error message when session has error', async () => {
    // Mock getSession with error
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: { message: 'Invalid token' }
    });
    
    render(
      <MemoryRouter initialEntries={['/auth/callback']}>
        <AuthCallbackPage />
      </MemoryRouter>
    );
    
    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('Authentication failed')).toBeInTheDocument();
      expect(screen.getByText('Invalid token')).toBeInTheDocument();
    });
  });

  it('shows error message when no session is found', async () => {
    // Mock getSession with no session
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: null
    });
    
    render(
      <MemoryRouter initialEntries={['/auth/callback']}>
        <AuthCallbackPage />
      </MemoryRouter>
    );
    
    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('Authentication failed')).toBeInTheDocument();
      expect(screen.getByText('No session found. Please try signing in again.')).toBeInTheDocument();
    });
  });

  it('allows manual retry when there is an error', async () => {
    // Mock getSession with error first, then success on second call
    (supabase.auth.getSession as jest.Mock)
      .mockResolvedValueOnce({
        data: { session: null },
        error: { message: 'Failed first attempt' }
      })
      .mockResolvedValueOnce({
        data: {
          session: {
            user: { id: 'test-user-id' }
          }
        },
        error: null
      });
    
    render(
      <MemoryRouter initialEntries={['/auth/callback']}>
        <AuthCallbackPage />
      </MemoryRouter>
    );
    
    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('Authentication failed')).toBeInTheDocument();
    });
    
    // Click "Try Again" button
    const retryButton = screen.getByText('Try Again');
    userEvent.click(retryButton);
    
    // Should show success message after retry
    await waitFor(() => {
      expect(screen.getByText('Successfully signed in!')).toBeInTheDocument();
    });
  });

  it('allows manual navigation to home when there is an error', async () => {
    // Mock getSession with error
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: { message: 'Authentication error' }
    });
    
    render(
      <MemoryRouter initialEntries={['/auth/callback']}>
        <AuthCallbackPage />
      </MemoryRouter>
    );
    
    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('Authentication failed')).toBeInTheDocument();
    });
    
    // Click "Return to home" button
    const homeButton = screen.getByText('Return to home');
    userEvent.click(homeButton);
    
    // Should navigate home immediately
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('handles timeout when auth takes too long', async () => {
    // Mock getSession to never resolve
    (supabase.auth.getSession as jest.Mock).mockImplementation(() => {
      return new Promise(() => {
        // Never resolves or rejects
      });
    });
    
    render(
      <MemoryRouter initialEntries={['/auth/callback']}>
        <AuthCallbackPage />
      </MemoryRouter>
    );
    
    // Should still be in loading state
    expect(screen.getByText('Finishing sign in...')).toBeInTheDocument();
    
    // Advance timers to trigger timeout (15 seconds)
    jest.advanceTimersByTime(15000);
    
    // Should show timeout error
    await waitFor(() => {
      expect(screen.getByText('Authentication failed')).toBeInTheDocument();
      expect(screen.getByText('Authentication is taking too long. Please try again.')).toBeInTheDocument();
    });
  });
});