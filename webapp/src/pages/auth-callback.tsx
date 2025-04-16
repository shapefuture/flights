import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { info, error as logError, debug } from '../utils/logger';

// Error types to handle
enum AuthCallbackErrorType {
  GENERIC = 'generic',
  SESSION_NOT_FOUND = 'session_not_found',
  NO_AUTH_DATA = 'no_auth_data',
  TIMEOUT = 'timeout'
}

export function AuthCallbackPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorType, setErrorType] = useState<AuthCallbackErrorType | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [timeElapsed, setTimeElapsed] = useState<number>(0);
  const navigate = useNavigate();
  const location = useLocation();

  // Function to create detailed error log info 
  const logErrorWithDetails = (message: string, err: any) => {
    const details = {
      path: location.pathname,
      search: location.search,
      hash: location.hash,
      referrer: document.referrer,
      userAgent: navigator.userAgent
    };
    
    logError(message, err, details);
  };

  // Redirect back to home page
  const handleRedirectHome = () => {
    debug('User manually redirecting to home after error');
    navigate('/');
  };

  // Retry the auth process
  const handleRetry = () => {
    debug('User manually retrying auth callback');
    setStatus('loading');
    setErrorType(null);
    handleAuthCallback();
  };

  // Handle the authentication callback process
  const handleAuthCallback = async () => {
    debug('Processing auth callback');
    let timeoutId: number | undefined;
    
    try {
      setStatus('loading');
      
      // Start a timeout to handle cases where auth hangs
      timeoutId = window.setTimeout(() => {
        if (status === 'loading') {
          logErrorWithDetails('Auth callback timeout after 15 seconds', { timeoutError: true });
          setErrorType(AuthCallbackErrorType.TIMEOUT);
          setErrorMessage('Authentication is taking too long. Please try again.');
          setStatus('error');
        }
      }, 15000);
      
      // Get the hash or query parameters from the URL
      const hash = window.location.hash;
      const query = window.location.search;
      
      // Log auth callback attempt
      info('Auth callback processing', { hasHash: !!hash, hasQuery: !!query });
      
      // The hash or query params include the access token and other OAuth information
      if (!hash && !query) {
        setErrorType(AuthCallbackErrorType.NO_AUTH_DATA);
        setErrorMessage('No authentication data found in URL. Please try signing in again.');
        throw new Error('No authentication data found in URL');
      }
      
      // Fetch session from URL
      const { data, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        logErrorWithDetails('Session error in auth callback', sessionError);
        setErrorType(AuthCallbackErrorType.GENERIC);
        setErrorMessage(sessionError.message || 'Failed to retrieve your session. Please try again.');
        throw sessionError;
      }
      
      if (data?.session) {
        info('Successfully retrieved session from auth callback', {
          userId: data.session.user.id,
          provider: data.session.user.app_metadata?.provider
        });
        
        setStatus('success');
        
        // Short delay to allow the user to see the success message
        setTimeout(() => {
          navigate('/');
        }, 1000);
      } else {
        logErrorWithDetails('No session found in auth callback', { noSession: true });
        setErrorType(AuthCallbackErrorType.SESSION_NOT_FOUND);
        setErrorMessage('No session found. Please try signing in again.');
        throw new Error('No session found');
      }
    } catch (err) {
      logErrorWithDetails('Error processing auth callback:', err);
      setStatus('error');
      
      // If error type hasn't been set, set a generic one
      if (!errorType) {
        setErrorType(AuthCallbackErrorType.GENERIC);
        setErrorMessage('Authentication failed. Please try again.');
      }
      
      // Redirect to sign in page after error
      setTimeout(() => {
        navigate('/');
      }, 5000);
    } finally {
      // Clear timeout if it exists
      if (timeoutId) window.clearTimeout(timeoutId);
    }
  };
  
  // Track time elapsed during loading state
  useEffect(() => {
    let intervalId: number | undefined;
    
    if (status === 'loading') {
      intervalId = window.setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [status]);
  
  useEffect(() => {
    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="h-screen flex flex-col items-center justify-center p-4">
      {status === 'loading' && (
        <>
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <h1 className="text-2xl font-bold mb-2">Finishing sign in...</h1>
          <p className="text-muted-foreground">
            Please wait while we complete your authentication
            {timeElapsed > 3 && timeElapsed < 8 && " (this may take a few moments)"}
            {timeElapsed >= 8 && " (taking longer than expected...)"}
          </p>
        </>
      )}
      
      {status === 'success' && (
        <>
          <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Successfully signed in!</h1>
          <p className="text-muted-foreground">Redirecting you to the home page...</p>
        </>
      )}
      
      {status === 'error' && (
        <>
          <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Authentication failed</h1>
          <p className="text-muted-foreground text-center mb-4">{errorMessage}</p>
          
          <div className="flex space-x-2">
            <Button onClick={handleRedirectHome} variant="outline">Return to home</Button>
            <Button onClick={handleRetry}>Try Again</Button>
          </div>
          
          <p className="text-xs text-muted-foreground mt-4">
            You will be automatically redirected in 5 seconds...
          </p>
        </>
      )}
    </div>
  );
}

export default AuthCallbackPage;