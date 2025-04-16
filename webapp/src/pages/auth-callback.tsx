import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { info, error as logError } from '../utils/logger';

export function AuthCallbackPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setStatus('loading');
        
        // Get the hash or query parameters from the URL
        const hash = window.location.hash;
        const query = window.location.search;
        
        // The hash or query params include the access token and other OAuth information
        if (!hash && !query) {
          throw new Error('No authentication data found in URL');
        }
        
        // Fetch session from URL
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }
        
        if (data?.session) {
          info('Successfully retrieved session from auth callback');
          setStatus('success');
          
          // Short delay to allow the user to see the success message
          setTimeout(() => {
            navigate('/');
          }, 1000);
        } else {
          throw new Error('No session found');
        }
      } catch (err) {
        logError('Error processing auth callback:', err);
        setStatus('error');
        
        // Redirect to sign in page after error
        setTimeout(() => {
          navigate('/');
        }, 3000);
      }
    };
    
    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="h-screen flex flex-col items-center justify-center">
      {status === 'loading' && (
        <>
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <h1 className="text-2xl font-bold mb-2">Finishing sign in...</h1>
          <p className="text-muted-foreground">Please wait while we complete your authentication</p>
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
          <p className="text-muted-foreground">There was a problem signing you in. Please try again.</p>
        </>
      )}
    </div>
  );
}

export default AuthCallbackPage;