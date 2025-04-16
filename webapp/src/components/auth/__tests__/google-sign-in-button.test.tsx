import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GoogleSignInButton } from '../google-sign-in-button';
import { useAuth } from '../../../context/auth-context';
import { useToast } from '../../ui/use-toast';
import { AuthError } from '../../../lib/supabase';

// Mock dependencies
jest.mock('../../../context/auth-context');
jest.mock('../../ui/use-toast');

describe('GoogleSignInButton', () => {
  // Mock functions
  const mockSignInWithGoogle = jest.fn();
  const mockToast = jest.fn();
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup default mock implementations
    (useAuth as jest.Mock).mockReturnValue({
      signInWithGoogle: mockSignInWithGoogle.mockResolvedValue({ error: null }),
    });
    
    (useToast as jest.Mock).mockReturnValue({
      toast: mockToast,
    });
  });
  
  it('renders correctly', () => {
    render(<GoogleSignInButton />);
    
    // Check that the button is rendered with correct text
    expect(screen.getByRole('button')).toHaveTextContent('Continue with Google');
    
    // Check that the Google logo is present
    expect(screen.getByRole('button').querySelector('svg')).toBeInTheDocument();
    
    // Check that the button has the correct aria-label
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Sign in with Google');
  });
  
  it('initiates Google sign in when clicked', async () => {
    mockSignInWithGoogle.mockResolvedValue({ error: null });
    
    render(<GoogleSignInButton onSuccess={mockOnSuccess} />);
    
    // Click the button
    fireEvent.click(screen.getByRole('button'));
    
    // Check that signInWithGoogle was called
    expect(mockSignInWithGoogle).toHaveBeenCalled();
    
    // Button should show loading state
    expect(screen.getByRole('button')).toHaveTextContent('Connecting...');
    
    // Wait for the async operation to complete
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });
  
  it('handles general sign in errors', async () => {
    const mockError = new Error('Google authentication failed');
    mockSignInWithGoogle.mockResolvedValue({ error: mockError });
    
    render(<GoogleSignInButton onError={mockOnError} />);
    
    // Click the button
    fireEvent.click(screen.getByRole('button'));
    
    // Wait for the async operation to complete
    await waitFor(() => {
      // Check that error toast was displayed
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: "Google sign in failed",
        variant: "destructive"
      }));
      
      // Check that onError callback was called
      expect(mockOnError).toHaveBeenCalledWith(mockError);
    });
  });
  
  it('handles specific auth errors', async () => {
    const authError = new AuthError('User canceled the Google sign-in', 'auth/popup-closed-by-user');
    mockSignInWithGoogle.mockResolvedValue({ error: authError });
    
    render(<GoogleSignInButton onError={mockOnError} />);
    
    // Click the button
    fireEvent.click(screen.getByRole('button'));
    
    // Wait for the async operation to complete
    await waitFor(() => {
      // Check that error toast was displayed with specific message
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: "Google sign in failed",
        description: "User canceled the Google sign-in",
        variant: "destructive"
      }));
      
      expect(mockOnError).toHaveBeenCalledWith(authError);
    });
  });
  
  it('prevents multiple clicks while loading', async () => {
    // Mock a delayed resolution
    mockSignInWithGoogle.mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => resolve({ error: null }), 100);
      });
    });
    
    render(<GoogleSignInButton />);
    
    // Click the button
    fireEvent.click(screen.getByRole('button'));
    
    // Click again while still loading
    fireEvent.click(screen.getByRole('button'));
    
    // Wait for the async operation to complete
    await waitFor(() => {
      // signInWithGoogle should only be called once
      expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1);
    });
  });
  
  it('disables button when loading', async () => {
    mockSignInWithGoogle.mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => resolve({ error: null }), 100);
      });
    });
    
    render(<GoogleSignInButton />);
    
    // Click the button
    fireEvent.click(screen.getByRole('button'));
    
    // Check that button is disabled
    expect(screen.getByRole('button')).toBeDisabled();
    
    // Wait for the loading state to end
    await waitFor(() => {
      expect(screen.getByRole('button')).not.toBeDisabled();
    });
  });
});