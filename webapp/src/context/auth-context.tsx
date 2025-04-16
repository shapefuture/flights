import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { debug, error as logError } from '../utils/logger';
import { Session, User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';

// Enums for providers
export enum AuthProvider {
  GOOGLE = 'google',
  EMAIL = 'email'
}

// Types for user subscription
export interface UserSubscription {
  tier: 'free' | 'basic' | 'premium' | 'enterprise';
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  monthlyQuota: number;
  remainingSearches: number;
}

// Default subscription for new users
const DEFAULT_SUBSCRIPTION: UserSubscription = {
  tier: 'free',
  status: 'active',
  currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  cancelAtPeriodEnd: false,
  monthlyQuota: 5,
  remainingSearches: 5
};

// Authentication context type definition
interface AuthContextType {
  session: Session | null;
  user: User | null;
  subscription: UserSubscription;
  isLoading: boolean;
  signIn: (provider: AuthProvider) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  decrementRemainingSearches: () => void;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription>(DEFAULT_SUBSCRIPTION);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Initialize the auth state
  useEffect(() => {
    async function initializeAuth() {
      try {
        setIsLoading(true);
        
        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }
        
        setSession(session);
        setUser(session?.user || null);
        
        if (session?.user) {
          await fetchUserSubscription(session.user.id);
        }
        
        // Set up auth state change listener
        const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            debug('Auth state changed:', event, !!newSession);
            
            setSession(newSession);
            setUser(newSession?.user || null);
            
            if (newSession?.user) {
              await fetchUserSubscription(newSession.user.id);
            } else {
              // Reset to default subscription when signed out
              setSubscription(DEFAULT_SUBSCRIPTION);
            }
          }
        );
        
        return () => {
          authSubscription.unsubscribe();
        };
      } catch (err) {
        logError('Error initializing auth:', err);
      } finally {
        setIsLoading(false);
      }
    }
    
    initializeAuth();
  }, []);
  
  // Fetch user subscription data
  async function fetchUserSubscription(userId: string) {
    try {
      // In a real app, you would fetch this from your database
      // Here we're setting a mock subscription for demonstration
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock subscription data - in production, fetch from your database
      const mockSubscription: UserSubscription = {
        tier: 'free',
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancelAtPeriodEnd: false,
        monthlyQuota: 5,
        remainingSearches: 5
      };
      
      setSubscription(mockSubscription);
    } catch (err) {
      logError('Error fetching user subscription:', err);
      setSubscription(DEFAULT_SUBSCRIPTION);
    }
  }
  
  // Sign in with a specific provider
  async function signIn(provider: AuthProvider) {
    try {
      setIsLoading(true);
      
      let { error } = await supabase.auth.signInWithOAuth({
        provider: provider.toString(),
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) throw error;
      
    } catch (err) {
      logError('Error signing in:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }
  
  // Sign in with email and password
  async function signInWithEmail(email: string, password: string) {
    try {
      setIsLoading(true);
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      return { error };
    } catch (err) {
      logError('Error signing in with email:', err);
      return { error: err instanceof Error ? err : new Error('An unknown error occurred') };
    } finally {
      setIsLoading(false);
    }
  }
  
  // Sign up with email and password
  async function signUpWithEmail(email: string, password: string) {
    try {
      setIsLoading(true);
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      return { error };
    } catch (err) {
      logError('Error signing up with email:', err);
      return { error: err instanceof Error ? err : new Error('An unknown error occurred') };
    } finally {
      setIsLoading(false);
    }
  }
  
  // Sign out
  async function signOut() {
    try {
      setIsLoading(true);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      // Reset state
      setSession(null);
      setUser(null);
      setSubscription(DEFAULT_SUBSCRIPTION);
      
      // Redirect to home page
      navigate('/');
    } catch (err) {
      logError('Error signing out:', err);
    } finally {
      setIsLoading(false);
    }
  }
  
  // Refresh the session
  async function refreshSession() {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) throw error;
      
      setSession(data.session);
      setUser(data.session?.user || null);
      
      if (data.session?.user) {
        await fetchUserSubscription(data.session.user.id);
      }
    } catch (err) {
      logError('Error refreshing session:', err);
    } finally {
      setIsLoading(false);
    }
  }
  
  // Decrement remaining searches (for quota management)
  function decrementRemainingSearches() {
    if (subscription.remainingSearches > 0) {
      setSubscription({
        ...subscription,
        remainingSearches: subscription.remainingSearches - 1
      });
    }
  }
  
  // The context value
  const value = {
    session,
    user,
    subscription,
    isLoading,
    signIn,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    refreshSession,
    decrementRemainingSearches
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}