import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { GoogleSignInButton } from '../google-sign-in-button';
import { useAuth } from '../../../context/auth-context';
import { useToast } from '../../ui/use-toast';

// Mock dependencies
jest.mock('../../../context/auth-context');
jest.mock('../../ui/use-toast');

describe('GoogleSignInButton', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup default mock implementations
    (useAuth as jest.Mock).mockReturnValue({
      signInWithGoogle: jest.fn().mockResolvedValue({ error: null }),
    });
    
    (useToast as jest.Mock).mockReturnValue({
      toast: jest.fn(),
    });
  });
  
  it('renders correctly', () => {
    render(<GoogleSignInButton />);
    
    // Check that the button is rendered with correct text
    expect(screen.getByRole('button')).toHaveTextContent('Continue with Google');
    
    // Check that the Google logo is present
    expect(screen.getByRole('button').querySelector('svg')).toBeInTheDocument();
  });
  
  it('initiates Google sign in when clicked', async () => {
    const mockSignInWithGoogle = jest.fn().mockResolvedValue({ error: null });
    (useAuth as jest.Mock).mockReturnValue({
      signInWithGoogle: mockSignInWithGoogle,
    });
    
    render(<GoogleSignInButton />);
    
    // Click the button
    fireEvent.click(screen.getByRole('button'));
    
    // Check that signInWithGoogle was called
    expect(mockSignInWithGoogle).toHaveBeenCalled();
    
    // Button should show loading state
    expect(screen.getByRole('button')).toHaveTextContent('Connecting...');
  });
  
  it('handles sign in errors', async () => {
    const mockError = new Error('Google authentication failed');
    const mockSignInWithGoogle = jest.fn().mockResolvedValue({ error: mockError });
    const mockToast = jest.fn();
    
    (useAuth as jest.Mock).mockReturnValue({
      signInWithGoogle: mockSignInWithGoogle,
    });
    
    (useToast as jest.Mock).mockReturnValue({
      toast: mockToast,
    });
    
    render(<GoogleSignInButton />);
    
    // Click the button
    fireEvent.click(screen.getByRole('button'));
    
    // Wait for promises to resolve
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Check that error toast was displayed
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: "Google sign in failed",
      variant: "destructive"
    }));
  });
});