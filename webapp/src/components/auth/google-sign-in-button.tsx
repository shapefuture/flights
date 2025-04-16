import React, { useState } from 'react';
import { Button } from '../ui/button';
import { useAuth } from '../../context/auth-context';
import { useToast } from '../ui/use-toast';
import { Loader2 } from 'lucide-react';
import { debug, error as logError, info } from '../../utils/logger';

interface GoogleSignInButtonProps {
  className?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function GoogleSignInButton({ 
  className, 
  onSuccess, 
  onError 
}: GoogleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { signInWithGoogle } = useAuth();
  const { toast } = useToast();

  const handleSignIn = async () => {
    if (isLoading) return; // Prevent multiple clicks
    
    setIsLoading(true);
    debug('Google sign-in button clicked');
    
    try {
      const { error } = await signInWithGoogle();
      
      if (error) {
        logError('Google sign-in failed:', error);
        toast({
          title: "Google sign in failed",
          description: error.message || 'An unexpected error occurred',
          variant: "destructive"
        });
        
        if (onError) {
          onError(error);
        }
        return;
      }
      
      // Success case - user will be redirected to Google
      info('Google sign-in initiated successfully');
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unable to initiate Google sign in');
      logError('Exception during Google sign-in:', error);
      
      toast({
        title: "An error occurred",
        description: "Unable to initiate Google sign in. Please try again.",
        variant: "destructive"
      });
      
      if (onError) {
        onError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      className={`w-full flex items-center justify-center ${className}`}
      onClick={handleSignIn}
      disabled={isLoading}
      aria-label="Sign in with Google"
      data-testid="google-sign-in-button"
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
          <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
          <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
          <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
        </svg>
      )}
      {isLoading ? "Connecting..." : "Continue with Google"}
    </Button>
  );
}