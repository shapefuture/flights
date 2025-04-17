import React from 'react';
import { Button } from '../ui/button';
import { Icons } from '../icons';
import { useAuth } from '../../context/auth-context';
import { useToast } from '../ui/use-toast';

interface GoogleSignInButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline';
  size?: 'default' | 'sm' | 'lg';
  showIcon?: boolean;
}

export function GoogleSignInButton({
  children,
  variant = 'outline',
  size = 'default',
  showIcon = true,
  ...props
}: GoogleSignInButtonProps) {
  const { signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  async function handleSignIn() {
    try {
      setIsLoading(true);
      await signInWithGoogle();
      // On successful sign-in, the auth state change handler will update the UI
      // No need for explicit success handling here
    } catch (err) {
      toast({
        title: "Authentication error",
        description: "There was an error signing in with Google",
        variant: "destructive",
      });
      console.error('Google sign in error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleSignIn}
      disabled={isLoading}
      className="w-full"
      {...props}
    >
      {isLoading ? (
        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        showIcon && <Icons.google className="mr-2 h-4 w-4" />
      )}
      {children || 'Sign in with Google'}
    </Button>
  );
}