import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../auth-context';
import { 
  supabase, 
  signInWithGoogle, 
  AuthProvider as AuthProviderEnum 
} from '../../lib/supabase';

// Mock Supabase
jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: {
          subscription: {
            unsubscribe: jest.fn(),
          },
        },
      })),
    },
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    update: jest.fn().mockReturnThis(),
    rpc: jest.fn(),
  },
  getUserSubscription: jest.fn(),
  signInWithGoogle: jest.fn(),
  AuthProvider: {
    GOOGLE: 'google',
    EMAIL: 'email',
  },
}));

// Mock logger
jest.mock('../../utils/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

// Test component that uses the auth context
function TestComponent() {
  const { 
    user, 
    isAuthenticated, 
    signIn, 
    signOut,
    signInWithGoogle: googleSignIn,
    isLoading,
    authProvider
  } = useAuth();
  
  return (
    <div>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <>
          <p>Is authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
          {user && (
            <>
              <p>User ID: {user.id}</p>
              <p>Auth Provider: {authProvider || 'none'}</p>
            </>
          )}
          <button onClick={() => signIn('test@example.com', 'password')}>Sign In</button>
          <button onClick={() => googleSignIn()}>Sign In with Google</button>
          <button onClick={() => signOut()}>Sign Out</button>
        </>
      )}
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful session retrieval
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: null,
    });
  });
  
  it('provides authentication state to components', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Initially loading
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    // After loading
    await waitFor(() => {
      expect(screen.getByText('Is authenticated: No')).toBeInTheDocument();
    });
  });
  
  it('handles email sign in', async () => {
    // Mock successful sign in
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { 
        user: { id: 'test-user-id' },
        session: { user: { id: 'test-user-id' } }
      },
      error: null,
    });
    
    // Mock auth state change to reflect the user being signed in
    (supabase.auth.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
      callback('SIGNED_IN', { 
        user: { 
          id: 'test-user-id',
          // No provider specified, should default to EMAIL
        } 
      });
      return {
        data: {
          subscription: {
            unsubscribe: jest.fn(),
          },
        },
      };
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Is authenticated: No')).toBeInTheDocument();
    });
    
    // Click sign in button
    const signInButton = screen.getByText('Sign In');
    await act(async () => {
      userEvent.click(signInButton);
    });
    
    // Verify sign in was called
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
    });
    
    // After auth state change, auth provider should be EMAIL
    await waitFor(() => {
      expect(screen.getByText('Auth Provider: email')).toBeInTheDocument();
    });
  });
  
  it('handles Google sign in', async () => {
    // Mock successful Google sign in
    (signInWithGoogle as jest.Mock).mockResolvedValue({
      data: { provider: 'google', url: 'https://oauth.google.com/redirect' },
      error: null,
    });
    
    // Mock auth state change for Google sign in
    (supabase.auth.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
      callback('SIGNED_IN', { 
        user: { 
          id: 'google-user-id',
          app_metadata: { provider: 'google' }, // Google provider
          identities: [{ provider: 'google' }]
        } 
      });
      return {
        data: {
          subscription: {
            unsubscribe: jest.fn(),
          },
        },
      };
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Is authenticated: No')).toBeInTheDocument();
    });
    
    // Click Google sign in button
    const googleSignInButton = screen.getByText('Sign In with Google');
    await act(async () => {
      userEvent.click(googleSignInButton);
    });
    
    // Verify Google sign in was called
    expect(signInWithGoogle).toHaveBeenCalled();
    
    // After auth state change, auth provider should be GOOGLE
    await waitFor(() => {
      expect(screen.getByText('Auth Provider: google')).toBeInTheDocument();
    });
  });
  
  it('handles Google sign in error', async () => {
    // Mock Google sign in error
    const mockError = new Error('Google authentication failed');
    (signInWithGoogle as jest.Mock).mockResolvedValue({
      data: null,
      error: mockError,
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Is authenticated: No')).toBeInTheDocument();
    });
    
    // Click Google sign in button
    const googleSignInButton = screen.getByText('Sign In with Google');
    await act(async () => {
      userEvent.click(googleSignInButton);
    });
    
    // Verify Google sign in was called
    expect(signInWithGoogle).toHaveBeenCalled();
    
    // User should remain unauthenticated
    expect(screen.getByText('Is authenticated: No')).toBeInTheDocument();
  });
  
  it('handles sign out', async () => {
    // Mock initial authenticated session
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { 
        session: { 
          user: { 
            id: 'test-user-id',
            app_metadata: { provider: 'google' }
          } 
        } 
      },
      error: null,
    });
    
    // Mock successful sign out
    (supabase.auth.signOut as jest.Mock).mockResolvedValue({
      error: null,
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for auth state to reflect the user
    await waitFor(() => {
      expect(screen.getByText('User ID: test-user-id')).toBeInTheDocument();
      expect(screen.getByText('Auth Provider: google')).toBeInTheDocument();
    });
    
    // Click sign out button
    const signOutButton = screen.getByText('Sign Out');
    await act(async () => {
      userEvent.click(signOutButton);
    });
    
    // Verify sign out was called
    expect(supabase.auth.signOut).toHaveBeenCalled();
  });
  
  it('correctly determines auth provider from user metadata', async () => {
    // Test with Google authentication
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { 
        session: { 
          user: { 
            id: 'google-user',
            app_metadata: { provider: 'google' },
            identities: [{ provider: 'google' }]
          } 
        } 
      },
      error: null,
    });
    
    const { unmount } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Auth Provider: google')).toBeInTheDocument();
    });
    
    // Unmount to clean up
    unmount();
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Test with email authentication
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { 
        session: { 
          user: { 
            id: 'email-user',
            app_metadata: { provider: 'email' },
          } 
        } 
      },
      error: null,
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Auth Provider: email')).toBeInTheDocument();
    });
  });
});