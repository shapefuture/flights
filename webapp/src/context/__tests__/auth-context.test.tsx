import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../auth-context';
import { supabase } from '../../lib/supabase';

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
}));

// Test component that uses the auth context
function TestComponent() {
  const { 
    user, 
    isAuthenticated, 
    signIn, 
    signOut, 
    isLoading
  } = useAuth();
  
  return (
    <div>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <>
          <p>Is authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
          {user && <p>User ID: {user.id}</p>}
          <button onClick={() => signIn('test@example.com', 'password')}>Sign In</button>
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
  
  it('handles sign in', async () => {
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
      callback('SIGNED_IN', { user: { id: 'test-user-id' } });
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
  });
  
  it('handles sign out', async () => {
    // Mock initial authenticated session
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { 
        session: { 
          user: { id: 'test-user-id' } 
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
    });
    
    // Click sign out button
    const signOutButton = screen.getByText('Sign Out');
    await act(async () => {
      userEvent.click(signOutButton);
    });
    
    // Verify sign out was called
    expect(supabase.auth.signOut).toHaveBeenCalled();
  });
});